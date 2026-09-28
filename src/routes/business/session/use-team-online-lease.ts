import { useEffect } from "react";
import { markSelfOnline } from "@/routes/business/identity/team-request";
import { showLocalApiFailure, showLocalCaughtError } from "@/routes/business/request";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import { useAppStore } from "@/routes/business/session/session-store";
import { useActiveTeam } from "@/routes/business/session/use-active-team";

const LEASE_RENEW_INTERVAL_MS = 5 * 60 * 1000;
async function renewOnlineLease(teamId: string, generation: number): Promise<void> {
  try {
    const result = await markSelfOnline(teamId);
    if (!isCurrentLease(teamId, generation)) return;
    if (!result.success) {
      showLocalApiFailure(
        result,
        (message, type) => {
          useToastStore.getState().showToast(message, type);
        },
        "在线状态更新失败，请检查网络",
      );
      console.error("[TeamOnline] 刷新在线状态失败:", result.error);
    }
  } catch (error) {
    if (!isCurrentLease(teamId, generation)) return;
    showLocalCaughtError(
      error,
      (message, type) => {
        useToastStore.getState().showToast(message, type);
      },
      "在线状态更新失败，请检查网络",
    );
    console.error("[TeamOnline] 刷新在线状态失败:", error);
  }
}

function isCurrentLease(teamId: string, generation: number): boolean {
  const state = useAppStore.getState();
  if (generation !== state.generation) return false;
  const members = state.loginState?.memberInfos ?? [];
  const active = members.find((member) => member.teamId === state.selectedTeamId) ?? members[0];
  return active?.teamId === teamId;
}

export function useTeamOnlineLease(): void {
  const { activeTeamId } = useActiveTeam();
  const generation = useAppStore((state) => state.generation);

  useEffect(() => {
    if (!activeTeamId) return;

    const renew = (): void => {
      void renewOnlineLease(activeTeamId, generation);
    };
    const handleVisibilityChange = (): void => {
      if (document.visibilityState === "visible") renew();
    };

    renew();

    const intervalId = setInterval(renew, LEASE_RENEW_INTERVAL_MS);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [activeTeamId, generation]);
}
