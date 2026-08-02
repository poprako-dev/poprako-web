import { beforeEach, describe, expect, test, vi } from "vitest";
import { listOnlineUserIds, markSelfOnline } from "./team";

function installFetch(response: Response) {
  const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    void input;
    void init;
    return Promise.resolve(response.clone());
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("team online API", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test("marks the authenticated user online with PUT", async () => {
    const fetchMock = installFetch(new Response(null, { status: 204 }));

    await expect(markSelfOnline("team_1")).resolves.toEqual({
      success: true,
      data: undefined,
    });

    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      "/api/v1/teams/team_1/mark-self-online",
    );
    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe("PUT");
  });

  test("lists online user IDs for one team", async () => {
    const fetchMock = installFetch(
      new Response(JSON.stringify({ code: 0, data: ["user_1", "user_2"] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(listOnlineUserIds("team_1")).resolves.toEqual({
      success: true,
      data: ["user_1", "user_2"],
    });
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      "/api/v1/teams/team_1/online-users",
    );
  });
});
