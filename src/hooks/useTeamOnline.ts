import { useEffect, useState } from "react";
import { listOnlineUserIds, markSelfOnline } from "@/api/team";
import { getUser } from "@/api/user";
import { useActiveTeam } from "@/hooks/useActiveTeam";
import type { UserInfo } from "@/types/user";

const LEASE_RENEW_INTERVAL_MS = 5 * 60 * 1000;
const ONLINE_USERS_REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const EMPTY_ONLINE_USER_IDS: ReadonlySet<string> = new Set();
const EMPTY_ONLINE_USERS: readonly UserInfo[] = [];

type OnlineUsersState = {
  teamId: string;
  userIds: ReadonlySet<string>;
};

type OnlineUserInfosState = {
  teamId: string;
  userIdSignature: string;
  users: readonly UserInfo[];
};

async function renewOnlineLease(teamId: string): Promise<void> {
  const result = await markSelfOnline(teamId);

  if (!result.success) {
    console.error("[TeamOnline] 刷新在线状态失败:", result.error);
  }
}

export function useTeamOnlineLease(): void {
  const { activeTeamId } = useActiveTeam();

  useEffect(() => {
    if (!activeTeamId) return;

    const renew = () => {
      void renewOnlineLease(activeTeamId);
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") renew();
    };

    renew();

    const intervalId = window.setInterval(renew, LEASE_RENEW_INTERVAL_MS);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [activeTeamId]);
}

export function useOnlineUserIds(teamId: string | null): ReadonlySet<string> {
  const [state, setState] = useState<OnlineUsersState | null>(null);

  useEffect(() => {
    let isCurrent = true;

    if (!teamId) return;

    const refresh = async () => {
      const result = await listOnlineUserIds(teamId);

      if (!isCurrent) return;

      if (!result.success) {
        console.error("[TeamOnline] 获取在线成员失败:", result.error);
        return;
      }

      setState({ teamId, userIds: new Set(result.data) });
    };

    void refresh();

    const intervalId = window.setInterval(
      () => void refresh(),
      ONLINE_USERS_REFRESH_INTERVAL_MS,
    );

    return () => {
      isCurrent = false;
      window.clearInterval(intervalId);
    };
  }, [teamId]);

  return state?.teamId === teamId ? state.userIds : EMPTY_ONLINE_USER_IDS;
}

export function useOnlineUsers(
  teamId: string | null,
  onlineUserIds: ReadonlySet<string>,
): readonly UserInfo[] {
  const userIdSignature = Array.from(onlineUserIds).join("\0");
  const [state, setState] = useState<OnlineUserInfosState | null>(null);

  useEffect(() => {
    let isCurrent = true;

    if (!teamId || !userIdSignature) return;

    const load = async () => {
      const results = await Promise.all(
        userIdSignature.split("\0").map((userId) => getUser(userId)),
      );

      if (!isCurrent) return;

      const users = results.flatMap((result) => {
        if (result.success) return [result.data];
        console.error("[TeamOnline] 获取在线用户资料失败:", result.error);
        return [];
      });

      users.sort((left, right) => left.name.localeCompare(right.name, "zh-CN"));
      setState({ teamId, userIdSignature, users });
    };

    void load();

    return () => {
      isCurrent = false;
    };
  }, [teamId, userIdSignature]);

  const isCurrent =
    state?.teamId === teamId && state.userIdSignature === userIdSignature;

  return isCurrent ? state.users : EMPTY_ONLINE_USERS;
}
