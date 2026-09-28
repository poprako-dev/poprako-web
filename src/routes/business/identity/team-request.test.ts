import { beforeEach, describe, expect, test, vi, type Mock } from "vitest";
import {
  listMyTeams,
  listOnlineUserIds,
  markSelfOnline,
} from "@/routes/business/identity/team-request";
import { useAppStore } from "@/routes/business/session/session-store";

type FetchMock = Mock<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>;

function installFetch(response: Response): FetchMock {
  const fetchMock: FetchMock = vi.fn((_input: RequestInfo | URL, _init?: RequestInit) => {
    return Promise.resolve(response.clone());
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("team API", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useAppStore.setState({ loginState: null });
  });

  test("lists teams for only the authenticated user", async () => {
    useAppStore.setState({
      loginState: {
        userInfo: {
          id: "user_1",
          qq: "10001",
          name: "Alice",
          avatarUrl: "",
          isSuperAdmin: false,
          lastActiveAt: 1,
          createdAt: 2,
          updatedAt: 3,
        },
        memberInfos: [],
      },
    });
    const fetchMock = installFetch(
      Response.json(
        {
          code: 0,
          data: [
            {
              id: "team_1",
              name: "Team",
              description: "Desc",
              avatar_url: null,
              created_at: 1,
              updated_at: 2,
            },
          ],
        },
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    await expect(listMyTeams({ offset: 0, limit: 20 })).resolves.toEqual({
      success: true,
      data: [
        {
          id: "team_1",
          name: "Team",
          description: "Desc",
          avatarUrl: "",
          avatarThumbnailUrl: "",
          createdAt: 1,
          updatedAt: 2,
        },
      ],
    });
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/v1/teams?user_id=user_1&offset=0&limit=20");
  });

  test("does not list teams without an authenticated user", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(listMyTeams({ offset: 0, limit: 20 })).resolves.toEqual({
      success: false,
      error: "未找到当前用户",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("marks the authenticated user online with PUT", async () => {
    const fetchMock = installFetch(new Response(null, { status: 204 }));

    await expect(markSelfOnline("team_1")).resolves.toEqual({
      success: true,
      data: undefined,
    });

    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/v1/teams/team_1/mark-self-online");
    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe("PUT");
  });

  test("lists online user IDs for one team", async () => {
    const fetchMock = installFetch(
      Response.json(
        { code: 0, data: ["user_1", "user_2"] },
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    await expect(listOnlineUserIds("team_1")).resolves.toEqual({
      success: true,
      data: ["user_1", "user_2"],
    });
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/v1/teams/team_1/online-users");
  });
});
