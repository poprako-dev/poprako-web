import { useEffect, useState } from "react";
import { listOnlineUserIds } from "@/routes/business/identity/team-request";
import { getUser } from "@/routes/business/identity/user-request";
import type { UserInfo } from "@/routes/business/identity/user";
const ONLINE_USERS_REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const EMPTY_ONLINE_USER_IDS: ReadonlySet<string> = new Set();
const EMPTY_ONLINE_USERS: readonly UserInfo[] = [];

type OnlineUsersState = {
  teamId: string;
  userIds: ReadonlySet<string>;
  status: "ready" | "error";
};

type OnlineUserInfosState = {
  teamId: string;
  userIdSignature: string;
  users: readonly UserInfo[];
  status: "ready" | "error";
};

export type OnlineUserStatus = "loading" | "ready" | "error";
type OnlineUserIds = { userIds: ReadonlySet<string>; status: OnlineUserStatus };
type OnlineUserInfos = { users: readonly UserInfo[]; status: OnlineUserStatus };

export function useOnlineUserIds(teamId: string | null): OnlineUserIds {
  const [state, setState] = useState<OnlineUsersState | null>(null);

  useEffect(() => {
    if (!teamId) return;

    let isCurrent = true;

    const refresh = async (): Promise<void> => {
      const result = await listOnlineUserIds(teamId);

      if (!isCurrent) return;

      if (!result.success) {
        console.error("[TeamOnline] 获取在线成员失败:", result.error);
        setState({ teamId, userIds: EMPTY_ONLINE_USER_IDS, status: "error" });
        return;
      }

      setState({ teamId, userIds: new Set(result.data), status: "ready" });
    };

    void refresh();

    const intervalId = setInterval(() => void refresh(), ONLINE_USERS_REFRESH_INTERVAL_MS);

    return () => {
      isCurrent = false;
      clearInterval(intervalId);
    };
  }, [teamId]);

  if (!teamId || state?.teamId !== teamId) {
    return { userIds: EMPTY_ONLINE_USER_IDS, status: "loading" };
  }
  return { userIds: state.userIds, status: state.status };
}

export function useOnlineUsers(teamId: string | null, onlineUsers: OnlineUserIds): OnlineUserInfos {
  const userIdSignature = [...onlineUsers.userIds].join("\0");
  const [state, setState] = useState<OnlineUserInfosState | null>(null);

  useEffect(() => {
    if (!teamId || onlineUsers.status !== "ready" || !userIdSignature) return;

    let isCurrent = true;

    const load = async (): Promise<void> => {
      const results = await Promise.all(
        userIdSignature.split("\0").map((userId) => getUser(userId)),
      );

      if (!isCurrent) return;

      const users: UserInfo[] = [];
      let hasError = false;
      for (const result of results) {
        if (result.success) users.push(result.data);
        else {
          hasError = true;
          console.error("[TeamOnline] 获取在线用户资料失败:", result.error);
        }
      }

      users.sort((left, right) => left.name.localeCompare(right.name, "zh-CN"));
      setState({
        teamId,
        userIdSignature,
        users,
        status: hasError ? "error" : "ready",
      });
    };

    void load();

    return () => {
      isCurrent = false;
    };
  }, [teamId, userIdSignature, onlineUsers.status]);

  const isCurrent = state?.teamId === teamId && state.userIdSignature === userIdSignature;

  if (onlineUsers.status === "error") {
    return { users: EMPTY_ONLINE_USERS, status: "error" };
  }
  if (onlineUsers.status === "loading" || !teamId) {
    return { users: EMPTY_ONLINE_USERS, status: "loading" };
  }
  if (!userIdSignature) return { users: EMPTY_ONLINE_USERS, status: "ready" };
  return isCurrent
    ? { users: state.users, status: state.status }
    : { users: EMPTY_ONLINE_USERS, status: "loading" };
}
