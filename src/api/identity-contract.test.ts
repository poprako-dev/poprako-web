import { expect, test } from "vitest";
import { createApiClient } from "@/api/client";
import { getMyUser, listMyMembers } from "@/api/identity/identity-api";

test("converts identity responses without dropping fields or inventing absent avatars", async () => {
  const client = createApiClient({
    baseUrl: "/api/v1",
    getAccessToken: () => "token",
    fetchImpl: () =>
      Promise.resolve(
        Response.json({
          code: 0,
          data: {
            id: "u1",
            qid: "user-1",
            nickname: "User",
            is_sadmin: false,
            last_active_at: 20,
            created_at: 1,
            updated_at: 2,
            extra_info: { display_name: "Server value" },
          },
        }),
      ),
  });
  const result = await getMyUser(client);
  expect(result).toMatchObject({
    success: true,
    data: { id: "u1", isSadmin: false, extraInfo: { displayName: "Server value" } },
  });
  if (!result.success) throw new Error(result.error);
  expect(Object.hasOwn(result.data, "avatarUrl")).toBe(false);
});

test("preserves nullable included identity records", async () => {
  const client = createApiClient({
    baseUrl: "/api/v1",
    getAccessToken: () => null,
    fetchImpl: () =>
      Promise.resolve(
        Response.json({
          code: 0,
          data: [
            {
              id: "m1",
              user_id: "u1",
              team_id: "t1",
              user: null,
              team: null,
              nickname: "Member",
              last_active_at: 10,
              roles: 3,
            },
          ],
        }),
      ),
  });
  expect(await listMyMembers(client, { offset: 0, limit: 20 })).toEqual({
    success: true,
    data: [
      {
        id: "m1",
        userId: "u1",
        teamId: "t1",
        user: null,
        team: null,
        nickname: "Member",
        lastActiveAt: 10,
        roles: 3,
      },
    ],
  });
});
