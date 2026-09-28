import { describe, expect, test, vi } from "vitest";
import { createApiClient } from "./client";
import {
  createAssignmentInvitation,
  deleteAssignmentInvitation,
  joinAssignmentInvitation,
  listAssignmentInvitations,
} from "./assignment-invitation";

function clientFor(data: unknown): {
  client: ReturnType<typeof createApiClient>;
  fetchImpl: ReturnType<typeof vi.fn<typeof fetch>>;
} {
  const fetchImpl = vi
    .fn<typeof fetch>()
    .mockImplementation(() => Promise.resolve(Response.json({ code: 0, data })));
  return {
    client: createApiClient({ baseUrl: "/api/v1", getAccessToken: () => "session", fetchImpl }),
    fetchImpl,
  };
}

describe("assignment invitation protocol", () => {
  test("keeps false filters and converts response keys without changing invitation codes", async () => {
    const { client, fetchImpl } = clientFor([
      {
        id: "invite",
        chapter_id: "chapter",
        inviter_id: "owner",
        invitee_qid: "10000",
        code: "keep_this_code",
        is_pending: false,
        roles: 0,
        created_at: 1,
        updated_at: 2,
      },
    ]);
    const result = await listAssignmentInvitations(client, {
      chapterId: "chapter",
      isPending: false,
      offset: 0,
      limit: 20,
    });
    expect(fetchImpl.mock.calls[0]?.[0]).toBe(
      "/api/v1/chapters/chapter/assignment-invitations?is_pending=false&offset=0&limit=20",
    );
    expect(result).toEqual({
      success: true,
      data: [
        {
          id: "invite",
          chapterId: "chapter",
          inviterId: "owner",
          inviteeQid: "10000",
          code: "keep_this_code",
          isPending: false,
          roles: 0,
          createdAt: 1,
          updatedAt: 2,
        },
      ],
    });
  });

  test("creates, joins and deletes with unchanged server operations", async () => {
    const { client, fetchImpl } = clientFor({ id: "invite", code: "keep_this_code" });
    expect(
      await createAssignmentInvitation(client, {
        chapterId: "chapter",
        inviteeQid: "10000",
        roles: 2,
      }),
    ).toEqual({ success: true, data: { id: "invite", code: "keep_this_code" } });
    expect(fetchImpl.mock.calls[0]?.[1]?.body).toBe(
      JSON.stringify({ chapter_id: "chapter", invitee_qid: "10000", roles: 2 }),
    );
    fetchImpl.mockImplementation(() =>
      Promise.resolve(
        Response.json(
          {
            code: 0,
            data: {
              id: "assignment",
              chapter_id: "chapter",
              user_id: "user",
              roles: 2,
              created_at: 1,
              updated_at: 2,
            },
          },
          { status: 201 },
        ),
      ),
    );
    expect(await joinAssignmentInvitation(client, "keep_this_code")).toMatchObject({
      success: true,
      data: { id: "assignment", chapterId: "chapter", userId: "user" },
    });
    expect(fetchImpl.mock.calls[1]?.[1]?.body).toBe('{"code":"keep_this_code"}');
    fetchImpl.mockImplementation(() => Promise.resolve(new Response(null, { status: 204 })));
    expect(await deleteAssignmentInvitation(client, "invite")).toEqual({
      success: true,
      data: undefined,
    });
    expect(fetchImpl.mock.calls[2]?.[0]).toBe("/api/v1/assignment-invitations/invite");
    expect(fetchImpl.mock.calls[2]?.[1]?.method).toBe("DELETE");
  });

  test("invalid list payloads are protocol failures, never empty success", async () => {
    const { client } = clientFor({ items: [] });
    expect(
      await listAssignmentInvitations(client, { chapterId: "chapter", offset: 0, limit: 20 }),
    ).toMatchObject({ success: false, failureKind: "protocol" });
  });
});
