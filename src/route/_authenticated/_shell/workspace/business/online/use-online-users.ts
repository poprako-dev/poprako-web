import { useEffect, useMemo, useState } from "react";
import { useApiClient } from "@/route/business/api-context";
import { useReadySession } from "@/route/business/session/ready-session";
import { listOnlineUserIds } from "@/api/identity/identity-api";
import type { UserInfo } from "@/route/business/identity/user";
import type { ApiClient } from "@/api/client";
import { createOnlineUserCache, loadOnlineUsers } from "./online-user-cache";

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const EMPTY_IDS: ReadonlySet<string> = new Set();
const EMPTY_USERS: readonly UserInfo[] = [];

export type OnlineUserStatus = "loading" | "ready" | "error";
type OnlineUserIds = { userIds: ReadonlySet<string>; status: OnlineUserStatus };
type OnlineUserInfos = { users: readonly UserInfo[]; status: OnlineUserStatus };
type Scope = { client: ApiClient; generation: number; userId: string; teamId: string | null };

function useOnlineScope(teamId: string | null): Scope {
  const client = useApiClient();
  const { generation, userInfo } = useReadySession();
  return useMemo(
    () => ({ client, generation, userId: userInfo.id, teamId }),
    [client, generation, userInfo.id, teamId],
  );
}

export function useOnlineUserIds(teamId: string | null): OnlineUserIds {
  const scope = useOnlineScope(teamId);
  const [state, setState] = useState<(OnlineUserIds & { scope: Scope }) | null>(null);
  useEffect(() => {
    if (!scope.teamId) return;
    const request = new AbortController();
    let pending = false;
    async function refresh(): Promise<void> {
      if (pending || !scope.teamId) return;
      pending = true;
      try {
        const result = await listOnlineUserIds(scope.client, scope.teamId, request.signal);
        if (request.signal.aborted) return;
        if (!result.success) console.error("[TeamOnline] 获取在线成员失败:", result.error);
        setState({
          scope,
          userIds: result.success ? new Set(result.data) : EMPTY_IDS,
          status: result.success ? "ready" : "error",
        });
      } catch (error) {
        if (request.signal.aborted) return;
        console.error("[TeamOnline] 获取在线成员失败:", error);
        setState({ scope, userIds: EMPTY_IDS, status: "error" });
      } finally {
        pending = false;
      }
    }
    void refresh();
    const interval = setInterval(() => void refresh(), REFRESH_INTERVAL_MS);
    return () => {
      request.abort();
      clearInterval(interval);
    };
  }, [scope]);
  return state?.scope === scope ? state : { userIds: EMPTY_IDS, status: "loading" };
}

export function useOnlineUsers(
  teamId: string | null,
  onlineUsers: OnlineUserIds,
  enabled = true,
): OnlineUserInfos {
  const scope = useOnlineScope(teamId);
  const { client, generation, userId } = scope;
  const cacheScope = useMemo(() => ({ client, generation, userId }), [client, generation, userId]);
  const cache = useMemo(() => createOnlineUserCache(cacheScope.client), [cacheScope]);
  const signature = [...onlineUsers.userIds].sort().join("\0");
  const [state, setState] = useState<
    (OnlineUserInfos & { scope: Scope; signature: string }) | null
  >(null);
  useEffect(() => {
    if (!enabled || !teamId || onlineUsers.status !== "ready" || !signature) return;
    const request = new AbortController();
    void loadOnlineUsers(cache, signature.split("\0"), request.signal).then((result) => {
      if (!request.signal.aborted) setState({ ...result, scope, signature });
    });
    return () => {
      request.abort();
    };
  }, [scope, teamId, signature, onlineUsers.userIds, onlineUsers.status, enabled, cache]);
  if (onlineUsers.status !== "ready") return { users: EMPTY_USERS, status: onlineUsers.status };
  if (!signature) return { users: EMPTY_USERS, status: "ready" };
  return state?.scope === scope && state.signature === signature
    ? state
    : { users: EMPTY_USERS, status: "loading" };
}
