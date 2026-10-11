import { createTestApi } from "@/test-resource/api-client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { Mock } from "vitest";
import { getComic } from "@/route/_authenticated/business/comic/comic-request";
import { useAppStore } from "@/route/business/session/session-store";
import { toMemberInfo } from "@/route/business/identity/api-adapter";
import { decodeApiMember } from "@/api/identity-contract";
import { toCamelCase } from "@/shared/utility/case-convert";
import {
  findComicMember,
  listComicMembers,
  loadComicDetail,
} from "@/route/_authenticated/_shell/business/comic-detail/detail-request";
import {
  detailChapter,
  detailComic,
  detailMember,
} from "@/route/_authenticated/_shell/business/test/detail-request-fixture";

function installFetch(
  comic: unknown = detailComic(),
  pinned: unknown = detailChapter(),
): Mock<(input: RequestInfo | URL) => Promise<Response>> {
  const fetchMock = vi.fn((input: RequestInfo | URL) => {
    const url = String(input); // eslint-disable-line @typescript-eslint/no-base-to-string
    return Promise.resolve(
      Response.json({
        code: 0,
        data: url.includes("/chapters/pinned") ? pinned : comic,
      }),
    );
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function registerComicContextTests(): void {
  test("loads comic context independently of the selected team", async () => {
    const fetchMock = installFetch();
    const result = await loadComicDetail(createTestApi(), "comic-b");
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
    await getComic(createTestApi(), "comic-b");
    await getComic(createTestApi(), "comic-b", ["workset.team", "creator"]);
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      "/api/v1/comics/comic-b",
      "/api/v1/comics/comic-b?incl=workset.team&incl=creator",
    ]);
  });

  test("converts direct and detail comic responses through the request adapter", async () => {
    installFetch();
    const directResult = await getComic(createTestApi(), "comic-b", ["workset.team"]);
    const detailResult = await loadComicDetail(createTestApi(), "comic-b");
    expect(directResult).toMatchObject({
      success: true,
      data: {
        workset: { teamId: "team-b" },
        team: { id: "team-b" },
        creator: { id: "reader" },
      },
    });
    if (!directResult.success || !detailResult.success) {
      throw new Error("Expected both comic request paths to succeed");
    }
    expect(detailResult.data.comicInfo).toEqual(directResult.data);
  });
}

function registerComicValidationTests(): void {
  test.each(["workset", "team"] as const)("rejects missing included %s", async (field) => {
    const comic = { ...detailComic(), [field]: undefined };
    installFetch(comic);
    expect(await loadComicDetail(createTestApi(), "comic-b")).toMatchObject({
      success: false,
    });
  });

  test("rejects inconsistent team relationships", async () => {
    const comic = detailComic();
    comic.team.id = "team-a";
    installFetch(comic);
    expect(await loadComicDetail(createTestApi(), "comic-b")).toMatchObject({ success: false });
  });

  test("accepts a comic with no pinned chapter", async () => {
    installFetch(detailComic(), null);
    expect(await loadComicDetail(createTestApi(), "comic-b")).toMatchObject({
      success: true,
      data: { pinnedChapter: null },
    });
  });
}

function registerMemberCandidateTests(): void {
  test("uses only the owning team's membership and role-filtered candidates", async () => {
    const fetchMock = installFetch();
    const result = await loadComicDetail(createTestApi(), "comic-b");
    if (!result.success) throw new Error(result.error);
    const members = ["team-a", "team-b"].map((id) =>
      toMemberInfo(decodeApiMember(toCamelCase(detailMember(id)))),
    );
    expect(findComicMember(result.data.comicInfo, members)?.teamId).toBe("team-b");
    expect(findComicMember(result.data.comicInfo, members.slice(0, 1))).toBeNull();
    fetchMock.mockResolvedValueOnce(
      Response.json({
        code: 0,
        data: [detailMember("team-b", "proofreader-b", 4)],
      }),
    );
    const candidates = await listComicMembers(createTestApi(), result.data.comicInfo, {
      role: "proofreader",
      keyword: "proofreader",
      offset: 20,
      limit: 20,
    });
    expect(fetchMock.mock.calls.at(-1)?.[0]).toBe(
      "/api/v1/members?team_id=team-b&incl=user&offset=20&limit=20" +
        "&fuzzy_nickname=proofreader&role=4",
    );
    expect(candidates).toMatchObject({
      success: true,
      data: [{ teamId: "team-b", userId: "proofreader-b" }],
    });
  });
}

function registerMemberFailureTests(): void {
  test("preserves member failures and distinguishes actual empty results", async () => {
    const fetchMock = installFetch();
    const result = await loadComicDetail(createTestApi(), "comic-b");
    if (!result.success) throw new Error(result.error);
    const args = { role: "translator" as const, offset: 0, limit: 20 };
    fetchMock.mockResolvedValueOnce(
      Response.json({ code: 4, message: "无权查看成员" }, { status: 403 }),
    );
    expect(await listComicMembers(createTestApi(), result.data.comicInfo, args)).toMatchObject({
      success: false,
      error: "无权查看成员",
      httpStatus: 403,
    });
    fetchMock.mockResolvedValueOnce(Response.json({ code: 0, data: [] }));
    expect(await listComicMembers(createTestApi(), result.data.comicInfo, args)).toEqual({
      success: true,
      data: [],
    });
  });
}

describe("comic detail team contract", () => {
  beforeEach(() => {
    useAppStore.setState({
      accessToken: null,
      selectedTeamId: "team-a",
      loginState: null,
    });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  registerComicContextTests();
  registerComicValidationTests();
  registerMemberCandidateTests();
  registerMemberFailureTests();
});
