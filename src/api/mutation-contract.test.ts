import { expect, test } from "vitest";
import { createApiClient } from "./client";
import { joinChapter } from "./chapter/chapter-api";
import { joinAssignmentInvitation } from "./assignment-invitation";
import { joinTeam, updateMemberRoles } from "./identity/identity-api";
import { upsertAssignment } from "./assignment/assignment-api";

// Shapes/statuses from poprako-server HTTP handlers and serialized view DTOs.
const assignment = {
  id: "assignment",
  chapter_id: "chapter",
  user_id: "user",
  roles: 2,
  created_at: 1,
  updated_at: 2,
};
function clientReturning(data: unknown, status = 201): ReturnType<typeof createApiClient> {
  return createApiClient({
    baseUrl: "/api/v1",
    getAccessToken: () => "session",
    fetchImpl: () =>
      Promise.resolve(
        status === 204
          ? new Response(null, { status })
          : Response.json({ code: 0, data }, { status }),
      ),
  });
}

test("self-joining a chapter accepts the server's 201 assignment response", async () => {
  expect(await joinChapter(clientReturning(assignment), "chapter", 2)).toMatchObject({
    success: true,
    data: { id: "assignment", chapterId: "chapter", userId: "user" },
  });
});

test("invitation joining accepts the server's 201 assignment response", async () => {
  expect(await joinAssignmentInvitation(clientReturning(assignment), "code")).toMatchObject({
    success: true,
    data: { id: "assignment" },
  });
});

test("joining a team accepts the server's 201 member response", async () => {
  const member = {
    id: "member",
    user_id: "user",
    team_id: "team",
    nickname: "Reader",
    last_active_at: 1,
    roles: 2,
  };
  expect(await joinTeam(clientReturning(member), "code")).toMatchObject({
    success: true,
    data: { id: "member", teamId: "team" },
  });
});

test("updating assignment roles accepts 204 without inventing a returned ID", async () => {
  expect(await upsertAssignment(clientReturning(undefined, 204), "chapter", "user", 2)).toEqual({
    success: true,
    data: undefined,
  });
});

test("a malformed joined assignment remains a protocol error", async () => {
  expect(await joinChapter(clientReturning({ id: "assignment" }), "chapter", 2)).toMatchObject({
    success: false,
    failureKind: "protocol",
  });
});

test("member role updates include the body ID required by the server", async () => {
  let body: unknown;
  const client = createApiClient({
    baseUrl: "/api/v1",
    getAccessToken: () => "session",
    fetchImpl: (_input, init) => {
      if (typeof init?.body !== "string") throw new Error("Expected a JSON request body");
      body = JSON.parse(init.body) as unknown;
      return Promise.resolve(new Response(null, { status: 204 }));
    },
  });
  await updateMemberRoles(client, "member", 2);
  expect(body).toEqual({ id: "member", roles: 2 });
});
