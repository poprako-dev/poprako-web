import { beforeEach, describe, expect, test, vi } from "vitest";
import type { ApiClient } from "@/api/client";
import type { ApiMember, ApiTeam, ApiUser } from "@/api/identity-contract";
import type { Result } from "@/shared/utility/result";
import { persistSessionData, useAppStore } from "@/route/business/session/session-store";

const requests = vi.hoisted(() => ({
  getMyUser: vi.fn(),
  listMyMembers: vi.fn(),
}));

vi.mock("@/api/identity/identity-api", () => ({
  getMyUser: requests.getMyUser,
  listMyMembers: requests.listMyMembers,
}));

const { beginSession, clearSession, ensureSession, selectTeam } = await import(
  "@/route/business/session/session"
);
const client = {} as ApiClient;

function user(id: string): ApiUser {
  return {
    id,
    qid: "123",
    nickname: id,
    avatarUrl: null,
    isSadmin: false,
    lastActiveAt: 1,
    createdAt: 1,
    updatedAt: 1,
  };
}

function team(id: string): ApiTeam {
  return {
    id,
    name: id,
    description: "",
    avatarUrl: null,
    createdAt: 1,
    updatedAt: 1,
  };
}

function members(teamIds: string[]): ApiMember[] {
  return teamIds.map((teamId) => ({
    id: `member-${teamId}`,
    userId: "user",
    teamId,
    team: team(teamId),
    nickname: "Member",
    lastActiveAt: 1,
    roles: 1,
  }));
}

function ok<Value>(data: Value): Result<Value> {
  return { success: true, data };
}

function deferred<Value>(): {
  promise: Promise<Value>;
  resolve: (value: Value) => void;
} {
  let resolve!: (value: Value) => void;
  const promise = new Promise<Value>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe("session identity recovery", () => {
  beforeEach(() => {
    clearSession();
    requests.getMyUser.mockReset();
    requests.listMyMembers.mockReset();
  });

  test("shares recovery and selects the first real team", async () => {
    const userRequest = deferred<Result<ApiUser>>();
    requests.getMyUser.mockReturnValue(userRequest.promise);
    requests.listMyMembers.mockResolvedValue(ok(members(["team-a", "team-b"])));
    beginSession("token-a");

    const first = ensureSession(client);
    const second = ensureSession(client);
    expect(first).toBe(second);
    expect(requests.getMyUser).toHaveBeenCalledWith(client);
    userRequest.resolve(ok(user("user-a")));

    const [firstState, secondState] = await Promise.all([first, second]);
    expect(firstState).toEqual(secondState);
    expect(useAppStore.getState().selectedTeamId).toBe("team-a");
    expect(requests.listMyMembers).toHaveBeenCalledWith(client, {
      offset: 0,
      limit: 200,
      includes: ["team"],
    });
  });

  test("a stale user response cannot start member loading or overwrite a new identity", async () => {
    const oldResponse = deferred<Result<ApiUser>>();
    requests.getMyUser
      .mockReturnValueOnce(oldResponse.promise)
      .mockResolvedValueOnce(ok(user("user-new")));
    requests.listMyMembers.mockResolvedValue(ok(members(["team-new"])));
    beginSession("token-old");

    const oldRequest = ensureSession(client);
    beginSession("token-new");
    const newState = await ensureSession(client);
    oldResponse.resolve(ok(user("user-old")));

    await expect(oldRequest).rejects.toThrow("会话已失效");
    expect(newState.userInfo.id).toBe("user-new");
    expect(useAppStore.getState().loginState?.userInfo.id).toBe("user-new");
  });
});

describe("session identity recovery", () => {
  beforeEach(() => {
    clearSession();
    requests.getMyUser.mockReset();
    requests.listMyMembers.mockReset();
  });

  test("rejects memberships with no included team instead of inventing a team", async () => {
    requests.getMyUser.mockResolvedValue(ok(user("user-a")));
    requests.listMyMembers.mockResolvedValue(
      ok([
        {
          id: "member-team-a",
          userId: "user-a",
          teamId: "team-a",
          team: null,
          nickname: "Member",
          lastActiveAt: 1,
          roles: 1,
        },
      ]),
    );
    beginSession("token-a");

    await expect(ensureSession(client)).rejects.toThrow("成员响应缺少团队信息");
    expect(useAppStore.getState().loginState).toBeNull();
    expect(useAppStore.getState().selectedTeamId).toBeNull();
  });
});

describe("session identity recovery", () => {
  beforeEach(() => {
    clearSession();
    requests.getMyUser.mockReset();
    requests.listMyMembers.mockReset();
  });

  test("validates selection and clears identity on logout", async () => {
    requests.getMyUser.mockResolvedValue(ok(user("user-a")));
    requests.listMyMembers.mockResolvedValue(ok(members(["team-a", "team-b"])));
    beginSession("token-a");
    await ensureSession(client);

    selectTeam("team-b");
    expect(useAppStore.getState().selectedTeamId).toBe("team-b");
    expect(() => {
      selectTeam("other-team");
    }).toThrow("无法选择不属于当前身份的团队");

    clearSession();
    expect(useAppStore.getState().accessToken).toBeNull();
    expect(useAppStore.getState().loginState).toBeNull();
    expect(useAppStore.getState().selectedTeamId).toBeNull();
  });
});

describe("session identity recovery", () => {
  beforeEach(() => {
    clearSession();
    requests.getMyUser.mockReset();
    requests.listMyMembers.mockReset();
  });

  test("persists credentials and team choice without persisting recovered identity", () => {
    beginSession("token-a");
    useAppStore.setState({
      loginState: {
        userInfo: {
          id: "user-a",
          qq: "123",
          name: "User",
          avatarUrl: "",
          isSuperAdmin: false,
          lastActiveAt: 1,
          createdAt: 1,
          updatedAt: 1,
        },
        memberInfos: [],
      },
      selectedTeamId: null,
    });

    expect(persistSessionData(useAppStore.getState())).toEqual({
      accessToken: "token-a",
      selectedTeamId: null,
    });
  });
});
