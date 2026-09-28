import { beforeEach, describe, expect, test, vi } from "vitest";
import type { UserInfo } from "@/routes/business/identity/user";
import type { MemberInfo } from "@/routes/business/identity/member";
import { persistSessionData, useAppStore } from "@/routes/business/session/session-store";

const requests = vi.hoisted(() => ({
  getMyUser: vi.fn<() => Promise<UserInfo>>(),
  listMyMembers: vi.fn<(args: { ownerId: string }) => Promise<MemberInfo[]>>(),
}));

vi.mock("@/routes/business/identity/user-request", () => ({
  getMyUser: requests.getMyUser,
}));
vi.mock("@/routes/business/identity/member-request", () => ({
  listMyMembers: requests.listMyMembers,
}));

const { beginSession, clearSession, ensureSession, selectTeam } = await import(
  "@/routes/business/session/session"
);

function user(id: string): UserInfo {
  return {
    id,
    qq: "123",
    name: id,
    avatarUrl: "",
    isSuperAdmin: false,
    lastActiveAt: 1,
    createdAt: 1,
    updatedAt: 1,
  };
}

function members(teamIds: string[]): MemberInfo[] {
  return teamIds.map((teamId, index) => ({
    id: `member-${teamId}`,
    userId: "user",
    teamId,
    roles: 1,
    createdAt: index,
    updatedAt: index,
  }));
}

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
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

  test("shares concurrent recovery and selects the first available team", async () => {
    const userRequest = deferred<UserInfo>();
    requests.getMyUser.mockReturnValue(userRequest.promise);
    requests.listMyMembers.mockResolvedValue(members(["team-a", "team-b"]));
    beginSession("token-a");

    const first = ensureSession();
    const second = ensureSession();
    expect(first).toBe(second);
    expect(requests.getMyUser).toHaveBeenCalledTimes(1);
    userRequest.resolve(user("user-a"));

    const [firstState, secondState] = await Promise.all([first, second]);
    expect(firstState).toEqual(secondState);
    expect(useAppStore.getState().selectedTeamId).toBe("team-a");
    expect(requests.listMyMembers).toHaveBeenCalledWith({ ownerId: "user-a" });
  });

  test("prevents an old identity response from overwriting a new session", async () => {
    const oldResponse = deferred<UserInfo>();
    requests.getMyUser
      .mockReturnValueOnce(oldResponse.promise)
      .mockResolvedValueOnce(user("user-new"));
    requests.listMyMembers.mockResolvedValue(members(["team-new"]));
    beginSession("token-old");

    const oldRequest = ensureSession();
    beginSession("token-new");
    const newState = await ensureSession();
    oldResponse.resolve(user("user-old"));

    await expect(oldRequest).rejects.toThrow("会话已失效");
    expect(newState.userInfo.id).toBe("user-new");
    expect(useAppStore.getState().loginState?.userInfo.id).toBe("user-new");
  });

  test("validates team selection and clears identity on logout", async () => {
    requests.getMyUser.mockResolvedValue(user("user-a"));
    requests.listMyMembers.mockResolvedValue(members(["team-a", "team-b"]));
    beginSession("token-a");
    await ensureSession();

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

  test("persists credentials and team choice without persisting recovered identity", () => {
    requests.getMyUser.mockResolvedValue(user("user-a"));
    requests.listMyMembers.mockResolvedValue(members(["team-a"]));
    beginSession("token-a");
    useAppStore.setState({
      loginState: { userInfo: user("user-a"), memberInfos: members(["team-a"]) },
      selectedTeamId: "team-a",
    });

    const persisted = persistSessionData(useAppStore.getState());

    expect(persisted).toEqual({ accessToken: "token-a", selectedTeamId: "team-a" });
  });
});
