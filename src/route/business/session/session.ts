import type { ApiClient } from "@/api/client";
import { getMyUser, listMyMembers } from "@/api/identity/identity-api";
import { toMemberInfo, toUserInfo } from "@/route/business/identity/api-adapter";
import type { LoginState } from "@/route/business/identity/login-state";
import { toApiRequestError } from "@/route/business/request-error";
import { useAppStore } from "@/route/business/session/session-store";
import type { Result } from "@/shared/utility/result";

type Initialization = { generation: number; promise: Promise<LoginState> };
let pending: Initialization | null = null;

export function beginSession(accessToken: string): void {
  if (!accessToken.trim()) throw new Error("访问令牌不能为空");
  useAppStore.getState().setAccessToken(accessToken);
}

export function clearSession(): void {
  useAppStore.getState().setAccessToken(null);
}

export function selectTeam(teamId: string): void {
  useAppStore.getState().setSelectedTeamId(teamId);
}

function assertCurrent(generation: number): void {
  if (useAppStore.getState().generation !== generation) {
    throw new Error("会话已失效");
  }
}

function initialize(client: ApiClient): Promise<LoginState> {
  const { accessToken, generation } = useAppStore.getState();
  if (!accessToken) {
    return Promise.reject(new Error("没有找到访问令牌，跳转至登录"));
  }
  if (pending?.generation === generation) return pending.promise;

  const promise = (async () => {
    const userResult = await getMyUser(client);
    assertCurrent(generation);
    if (!userResult.success) throw toApiRequestError(userResult);

    const membersResult = await listMyMembers(client, {
      offset: 0,
      limit: 200,
      includes: ["team"],
    });
    assertCurrent(generation);
    if (!membersResult.success) throw toApiRequestError(membersResult);
    if (membersResult.data.some((member) => member.team === null || member.team === undefined)) {
      throw new Error("成员响应缺少团队信息");
    }

    const loginState: LoginState = {
      userInfo: toUserInfo(userResult.data),
      memberInfos: membersResult.data.map((value) => {
        const member = toMemberInfo(value);
        if (!member.team) throw new Error("成员响应缺少团队信息");
        return { ...member, team: member.team };
      }),
    };
    assertCurrent(generation);
    useAppStore.getState().setLoginState(loginState);
    return loginState;
  })().finally(() => {
    if (pending?.generation === generation) pending = null;
  });
  pending = { generation, promise };
  return promise;
}

export function ensureSession(client: ApiClient): Promise<LoginState> {
  const { loginState, accessToken } = useAppStore.getState();
  return loginState && accessToken ? Promise.resolve(loginState) : initialize(client);
}

export async function refreshSession(client: ApiClient): Promise<Result<LoginState>> {
  try {
    return { success: true, data: await initialize(client) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "刷新登录状态失败",
      ...(typeof error === "object" &&
      error !== null &&
      "httpStatus" in error &&
      typeof error.httpStatus === "number"
        ? { httpStatus: error.httpStatus }
        : {}),
    };
  }
}
