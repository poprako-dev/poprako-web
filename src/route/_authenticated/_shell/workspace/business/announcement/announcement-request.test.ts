import { parseRequestBody } from "@/test-resource/api-client";
import { createAnnouncement, updateAnnouncement, deleteAnnouncement } from "@/api/announcement";
import { describe, expect, test, vi } from "vitest";
import { createApiClient } from "@/api/client";
import { listAnnouncements } from "@/route/_authenticated/_shell/workspace/business/announcement/announcement-request";

function makeClient(fetchImpl: typeof fetch): ReturnType<typeof createApiClient> {
  return createApiClient({
    baseUrl: "/api/v1",
    getAccessToken: () => "session-token",
    fetchImpl,
  });
}

describe("workspace announcement API", () => {
  test("lists and maps announcements while preserving absent optional user data", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        code: 0,
        data: [
          {
            id: "announcement-1",
            team_id: "team-1",
            user_id: "user-1",
            title: "Update",
            content: "Details",
            created_at: 1720000000,
          },
        ],
      }),
    );

    const result = await listAnnouncements(makeClient(fetchImpl), {
      teamId: "team-1",
      offset: 0,
      limit: 3,
    });

    expect(result).toEqual({
      success: true,
      data: [
        {
          id: "announcement-1",
          teamId: "team-1",
          userId: "user-1",
          title: "Update",
          content: "Details",
          createdAt: 1720000000,
        },
      ],
    });
    expect(fetchImpl.mock.calls[0]?.[0]).toBe(
      "/api/v1/teams/team-1/announcements?offset=0&limit=3&incl=user",
    );
  });

  test("creates, updates, and deletes using camel-case endpoint inputs", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ code: 0, data: { id: "announcement-2" } }))
      .mockResolvedValueOnce(Response.json({ code: 0, data: null }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    const client = makeClient(fetchImpl);

    await expect(
      createAnnouncement(client, { teamId: "team-1", title: "Title", content: "Body" }),
    ).resolves.toEqual({ success: true, data: "announcement-2" });
    await expect(
      updateAnnouncement(client, "announcement-2", { title: "Edit", content: "Text" }),
    ).resolves.toMatchObject({ success: true });
    await expect(deleteAnnouncement(client, "announcement-2")).resolves.toMatchObject({
      success: true,
    });

    expect(parseRequestBody(fetchImpl.mock.calls[0]?.[1]?.body)).toEqual({
      team_id: "team-1",
      title: "Title",
      content: "Body",
    });
    expect(parseRequestBody(fetchImpl.mock.calls[1]?.[1]?.body)).toEqual({
      id: "announcement-2",
      title: "Edit",
      content: "Text",
    });
    expect(fetchImpl.mock.calls[2]?.[0]).toBe("/api/v1/announcements/announcement-2");
  });
});
