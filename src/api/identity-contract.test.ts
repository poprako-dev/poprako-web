import { describe, expect, test } from "vitest";
import { ApiDecodeError } from "@/api/api-error";
import { decodeApiMember, decodeApiTeam, decodeApiUser } from "@/api/identity-contract";

describe("identity API contracts", () => {
  test("accepts nullable included member records and omitted avatars", () => {
    const member = decodeApiMember({
      id: "m1",
      userId: "u1",
      teamId: "t1",
      user: null,
      team: null,
      nickname: "Member",
      lastActiveAt: 10,
      roles: 3,
    });
    const user = decodeApiUser({
      id: "u1",
      qid: "user-1",
      nickname: "User",
      isSadmin: false,
      lastActiveAt: 20,
      createdAt: 1,
      updatedAt: 2,
    });
    const team = decodeApiTeam({
      id: "t1",
      name: "Team",
      description: "",
      createdAt: 1,
      updatedAt: 2,
    });

    expect(member.user).toBeNull();
    expect(member.team).toBeNull();
    expect(user.avatarUrl).toBeNull();
    expect(team.avatarUrl).toBeNull();
    expect("createdAt" in member).toBe(false);
  });
});

describe("identity API contracts", () => {
  test("rejects malformed required identity fields", () => {
    expect(() =>
      decodeApiMember({
        id: "m1",
        userId: "u1",
        teamId: "t1",
        nickname: "Member",
        roles: 3,
      }),
    ).toThrow(ApiDecodeError);
    expect(() =>
      decodeApiMember({
        id: "m1",
        userId: "u1",
        teamId: "t1",
        nickname: "Member",
        lastActiveAt: "yesterday",
        roles: 3,
      }),
    ).toThrow(ApiDecodeError);
  });
});
