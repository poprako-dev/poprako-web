import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { getComic } from "@/features/ComicPlayground/api/comic";
import { fetchMyAssignmentComicCards } from "@/features/Workspace/api/workspace";
import { useAppStore } from "@/store/app";
import { toComicInfo } from "@/types/comic";
import { unwrapRawComicInfo } from "@/types/raw/comic";
import { unwrapRawMemberInfo } from "@/types/raw/member";
import { unwrapRawUserInfo } from "@/types/raw/user";
import { findComicMember, listComicMembers, loadComicDetail } from "./detail";
import { detailChapter, detailComic, detailMember, detailUser } from "./detail.fixtures";

function installFetch(comic = detailComic(), pinned: unknown = detailChapter()) {
  const fetchMock = vi.fn((input: RequestInfo | URL) => {
    const url = String(input); // eslint-disable-line @typescript-eslint/no-base-to-string
    return Promise.resolve(Response.json({
      code: 0, data: url.includes("/chapters/pinned") ? pinned : comic,
    }));
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("comic detail team contract", () => {
  beforeEach(() => {
    useAppStore.setState({ accessToken: null, selectedTeamId: "team-a", loginState: null });
  });
  afterEach(() => { vi.unstubAllGlobals(); });

  test("loads comic context independently of the selected team", async () => {
    const fetchMock = installFetch();
    const result = await loadComicDetail("comic-b");
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      "/api/v1/comics/comic-b?incl=workset.team",
      "/api/v1/comics/comic-b/chapters/pinned",
    ]);
    expect(result).toMatchObject({
      success: true,
      data: {
        comicInfo: { workset: { teamId: "team-b" }, team: { id: "team-b" } },
        pinnedChapter: { id: "pinned-comic-b" },
      },
    });
  });

  test("preserves the base API and serializes repeatable includes", async () => {
    const fetchMock = installFetch();
    await getComic("comic-b");
    await getComic("comic-b", ["workset.team", "creator"]);
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      "/api/v1/comics/comic-b",
      "/api/v1/comics/comic-b?incl=workset.team&incl=creator",
    ]);
  });

  test("uses one conversion for comics obtained directly or through included chapters", () => {
    const raw = detailComic();
    expect(toComicInfo(raw)).toEqual(unwrapRawComicInfo(raw));
    expect(unwrapRawComicInfo(raw)).toMatchObject({
      workset: { teamId: "team-b" }, team: { id: "team-b" }, creator: { id: "reader" },
    });
  });

  test("preserves workspace dotted includes through the assignment boundary", async () => {
    useAppStore.setState({
      loginState: { userInfo: unwrapRawUserInfo(detailUser()), memberInfos: [] },
    });
    const fetchMock = installFetch();
    fetchMock.mockResolvedValueOnce(Response.json({ code: 0, data: [{
      id: "assignment", user_id: "reader", chapter_id: "pinned-comic-b", roles: 2,
      created_at: 1, updated_at: 1,
      chapter: { ...detailChapter(), comic: detailComic() },
    }] }));
    const result = await fetchMyAssignmentComicCards(0, 12);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "/api/v1/assignments?owner_id=reader&incl=chapter.comic.workset.team&offset=0&limit=12",
    );
    expect(result).toMatchObject({
      success: true, data: [{ comicInfo: { workset: { teamId: "team-b" } } }],
    });
  });

  test.each(["workset", "team"] as const)("rejects missing included %s", async (field) => {
    const comic = detailComic();
    comic[field] = undefined;
    installFetch(comic);
    expect(await loadComicDetail("comic-b")).toMatchObject({ success: false });
  });

  test("rejects inconsistent team relationships", async () => {
    const comic = detailComic();
    if (!comic.team) {throw new Error("Missing fixture team");}
    comic.team.id = "team-a";
    installFetch(comic);
    expect(await loadComicDetail("comic-b")).toMatchObject({ success: false });
  });

  test("accepts a comic with no pinned chapter", async () => {
    installFetch(detailComic(), null);
    expect(await loadComicDetail("comic-b")).toMatchObject({
      success: true, data: { pinnedChapter: null },
    });
  });

  test("uses only the owning team's membership and role-filtered candidates", async () => {
    const fetchMock = installFetch();
    const result = await loadComicDetail("comic-b");
    if (!result.success) {throw new Error(result.error);}
    const members = ["team-a", "team-b"].map((id) => unwrapRawMemberInfo(detailMember(id)));
    expect(findComicMember(result.data.comicInfo, members)?.teamId).toBe("team-b");
    expect(findComicMember(result.data.comicInfo, members.slice(0, 1))).toBeNull();
    fetchMock.mockResolvedValueOnce(Response.json({
      code: 0, data: [detailMember("team-b", "proofreader-b", 4)],
    }));
    const candidates = await listComicMembers(result.data.comicInfo, {
      role: "proofreader", keyword: "proofreader", offset: 20, limit: 20,
    });
    expect(fetchMock.mock.calls.at(-1)?.[0]).toBe(
      "/api/v1/members?team_id=team-b&offset=20&limit=20"
      + "&incl=user&fuzzy_nickname=proofreader&role=4",
    );
    expect(candidates).toMatchObject({
      success: true, data: [{ teamId: "team-b", userId: "proofreader-b" }],
    });
  });

  test("preserves member failures and distinguishes actual empty results", async () => {
    const fetchMock = installFetch();
    const result = await loadComicDetail("comic-b");
    if (!result.success) {throw new Error(result.error);}
    const args = { role: "translator" as const, offset: 0, limit: 20 };
    fetchMock.mockResolvedValueOnce(Response.json(
      { code: 4, message: "无权查看成员" }, { status: 403 },
    ));
    expect(await listComicMembers(result.data.comicInfo, args)).toMatchObject({
      success: false, error: "无权查看成员", httpStatus: 403,
    });
    fetchMock.mockResolvedValueOnce(Response.json({ code: 0, data: [] }));
    expect(await listComicMembers(result.data.comicInfo, args))
      .toEqual({ success: true, data: [] });
  });
});
