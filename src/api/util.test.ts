import { beforeEach, describe, expect, test, vi } from "vitest";

import { api } from "./util";

function installFetch(response: Response) {
  const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    void input;
    void init;
    return Promise.resolve(response.clone());
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("api util", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test("serializes array query params as repeated keys for poprako-r incl", async () => {
    const fetchMock = installFetch(
      new Response(JSON.stringify({ code: 0, data: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await api.get("/members", {
      owner_id: "user_1",
      incl: ["team", "user"],
      offset: 0,
      limit: 100,
    });

    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      "/api/v1/members?owner_id=user_1&incl=team&incl=user&offset=0&limit=100",
    );
  });

  test("rejects non-zero application codes even when HTTP status is ok", async () => {
    installFetch(
      new Response(JSON.stringify({ code: 3, message: "auth failed" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(api.get("/users/me")).resolves.toEqual({
      success: false,
      error: "auth failed",
    });
  });

  test("accepts empty 204 responses as undefined data", async () => {
    installFetch(new Response(null, { status: 204 }));

    await expect(api.post<void, Record<string, never>>("/auth/logout", {}))
      .resolves.toEqual({ success: true, data: undefined });
  });

  test("does not send cookies that can override authorization headers", async () => {
    const fetchMock = installFetch(
      new Response(JSON.stringify({ code: 0, data: {} }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await api.get("/users/me");

    expect(fetchMock.mock.calls[0]?.[1]?.credentials).toBe("omit");
  });
});
