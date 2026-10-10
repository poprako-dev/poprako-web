import { parseRequestBody } from "@/test-resource/api-client";
import { createComment } from "@/api/comment";
import { describe, expect, test, vi } from "vitest";
import { createApiClient } from "@/api/client";
import { listComments } from "@/route/_authenticated/_shell/workspace/business/comment/comment-request";

function makeClient(fetchImpl: typeof fetch): ReturnType<typeof createApiClient> {
  return createApiClient({
    baseUrl: "/api/v1",
    getAccessToken: () => "session-token",
    fetchImpl,
  });
}

describe("workspace comment API", () => {
  test("lists comments with requested inclusion and decodes domain fields", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        code: 0,
        data: [
          {
            id: "comment-1",
            team_id: "team-1",
            user_id: "user-1",
            content: "Hello",
            created_at: 1720000000,
          },
        ],
      }),
    );

    const result = await listComments(makeClient(fetchImpl), {
      teamId: "team-1",
      offset: 2,
      limit: 10,
      includes: ["user"],
    });

    expect(result).toEqual({
      success: true,
      data: [
        {
          id: "comment-1",
          teamId: "team-1",
          userId: "user-1",
          content: "Hello",
          createdAt: 1720000000,
        },
      ],
    });
    expect(fetchImpl.mock.calls[0]?.[0]).toBe(
      "/api/v1/teams/team-1/comments?offset=2&limit=10&incl=user",
    );
  });
});

describe("workspace comment API", () => {
  test("creates a comment using the normalized input contract", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ code: 0, data: { id: "comment-2" } }));

    const result = await createComment(makeClient(fetchImpl), {
      teamId: "team-1",
      content: "Reply",
    });

    expect(result).toEqual({ success: true, data: "comment-2" });
    const [, init] = fetchImpl.mock.calls[0] ?? [];
    expect(parseRequestBody(init?.body)).toEqual({ team_id: "team-1", content: "Reply" });
  });
});
