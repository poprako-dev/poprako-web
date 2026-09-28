import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { toUserInfo } from "@/route/business/identity/api-adapter";
import { decodeApiUser } from "@/api/identity-contract";
import { toCamelCase } from "@/shared/utility/case-convert";
import { createTestApi } from "@/test-resource/api-client";
import { useAppStore } from "@/route/business/session/session-store";
import { fetchMyAssignmentComicCards } from "@/route/_authenticated/_shell/workspace/business/assignment/workspace-request";
import {
  detailChapter,
  detailComic,
  detailUser,
} from "@/route/_authenticated/_shell/business/test/detail-request-fixture";

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
        userInfo: toUserInfo(decodeApiUser(toCamelCase(detailUser()))),
        memberInfos: [],
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("preserves dotted team includes through the workspace assignment boundary", async () => {
    const fetchMock = installFetch();
    const result = await fetchMyAssignmentComicCards(createTestApi(), "reader", 0, 12);

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
