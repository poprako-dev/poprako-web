import { createTestApi } from "@/test-resource/api-client";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { getUser } from "@/route/business/identity/user-request";

function installFetch(response: Response): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn((_input: RequestInfo | URL, _init?: RequestInit) => {
    return Promise.resolve(response.clone());
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("user API", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test("gets one user by ID", async () => {
    const fetchMock = installFetch(
      Response.json(
        {
          code: 0,
          data: {
            id: "user_1",
            qid: "10001",
            nickname: "Alice",
            avatar_url: "https://example.com/avatar.png",
            is_sadmin: false,
            last_active_at: 1,
            created_at: 2,
            updated_at: 3,
          },
        },
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    const result = await getUser(createTestApi(), "user_1");

    expect(result.success && result.data.name).toBe("Alice");
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/v1/users/user_1");
  });
});
