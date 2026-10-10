import { parseRequestBody } from "@/test-resource/api-client";
import { describe, expect, test, vi } from "vitest";
import { createApiClient } from "@/api/client";
import {
  createInvitation,
  listInvitations,
} from "@/route/_authenticated/_shell/member-list/business/invitation/invitation-request";

function makeClient(fetchImpl: typeof fetch): ReturnType<typeof createApiClient> {
  return createApiClient({
    baseUrl: "/api/v1",
    getAccessToken: () => "session-token",
    fetchImpl,
  });
}

describe("member invitation API", () => {
  test("decodes member invitations and converts list parameters to wire names", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        code: 0,
        data: [
          {
            id: "invite-1",
            code: "join-code",
            invitee_qid: "12345",
            invitor_id: "user-1",
            is_pending: true,
            roles: 3,
            team_id: "team-1",
          },
        ],
      }),
    );

    const result = await listInvitations(makeClient(fetchImpl), {
      teamId: "team-1",
      offset: 5,
      limit: 20,
      includes: ["invitor"],
      isPending: true,
    });

    expect(result).toEqual({
      success: true,
      data: [
        {
          id: "invite-1",
          invitationCode: "join-code",
          inviteeQq: "12345",
          invitorId: "user-1",
          isPending: true,
          roles: 3,
        },
      ],
    });
    expect(fetchImpl.mock.calls[0]?.[0]).toBe(
      "/api/v1/teams/team-1/member-invitations?offset=5&limit=20&is_pending=true&incl=invitor",
    );
  });
});

describe("member invitation API", () => {
  test("posts invitation values in the backend wire format", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ code: 0, data: { id: "invite-2", code: "new-code" } }));

    const result = await createInvitation(makeClient(fetchImpl), {
      teamId: "team-1",
      inviteeQq: "98765",
      roles: 7,
    });

    expect(result).toEqual({ success: true, data: "new-code" });
    const [, init] = fetchImpl.mock.calls[0] ?? [];
    expect(parseRequestBody(init?.body)).toEqual({
      team_id: "team-1",
      invitee_qid: "98765",
      roles: 7,
    });
  });
});
