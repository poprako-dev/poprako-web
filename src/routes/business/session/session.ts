import { useAppStore } from "@/routes/business/session/session-store";
import { listMyMembers } from "@/routes/business/identity/member-request";
import { getMyUser } from "@/routes/business/identity/user-request";
import type { LoginState } from "@/routes/business/identity/login-state";
import type { Result } from "@/shared/utility/result";
import { ApiRequestError } from "@/routes/business/request-error";

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
function initialize(): Promise<LoginState> {
  const { accessToken, generation } = useAppStore.getState();
  if (!accessToken) {
    return Promise.reject(new Error("没有找到访问令牌，跳转至登录"));
  }
  if (pending?.generation === generation) return pending.promise;
  const promise = (async () => {
    const userInfo = await getMyUser();
    assertCurrent(generation);
    const memberInfos = await listMyMembers({ ownerId: userInfo.id });
    assertCurrent(generation);
    const loginState = { userInfo, memberInfos };
    useAppStore.getState().setLoginState(loginState);
    return loginState;
  })().finally(() => {
    if (pending?.generation === generation) pending = null;
  });
  pending = { generation, promise };
  return promise;
}
export function ensureSession(): Promise<LoginState> {
  const { loginState, accessToken } = useAppStore.getState();
  return loginState && accessToken ? Promise.resolve(loginState) : initialize();
}
export async function refreshSession(): Promise<Result<LoginState>> {
  try {
    return { success: true, data: await initialize() };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "刷新登录状态失败",
      ...(error instanceof ApiRequestError && error.httpStatus !== undefined
        ? { httpStatus: error.httpStatus }
        : {}),
    };
  }
}
