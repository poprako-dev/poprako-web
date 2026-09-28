import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { unwrapRawUserInfo } from "@/routes/business/identity/raw-user";
import { useAppStore } from "@/routes/business/session/session-store";
import { fetchMyAssignmentComicCards } from "@/routes/_authenticated/_shell/workspace/business/assignment/workspace-request";
import {
  detailChapter,
  detailComic,
  detailUser,
} from "@/routes/_authenticated/_shell/business/test/detail-request-fixture";

function installFetch(): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn((_input: RequestInfo | URL) =>
    Promise.resolve(
      Response.json({
        code: 0,
        data: [
          {
            id: "assignment",
            user_id: "reader",
            chapter_id: "pinned-comic-b",
            roles: 2,
            created_at: 1,
            updated_at: 1,
            chapter: { ...detailChapter(), comic: detailComic() },
          },
        ],
      }),
    ),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("workspace assignment comic integration", () => {
  beforeEach(() => {
    useAppStore.setState({
      accessToken: null,
      selectedTeamId: "team-a",
      loginState: {
        userInfo: unwrapRawUserInfo(detailUser()),
        memberInfos: [],
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("preserves dotted team includes through the workspace assignment boundary", async () => {
    const fetchMock = installFetch();
    const result = await fetchMyAssignmentComicCards(0, 12);

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "/api/v1/assignments?owner_id=reader&incl=chapter.comic.workset.team&offset=0&limit=12",
    );
    expect(result).toMatchObject({
      success: true,
      data: [
        {
          comicInfo: { workset: { teamId: "team-b" }, team: { id: "team-b" } },
        },
      ],
    });
  });
});
