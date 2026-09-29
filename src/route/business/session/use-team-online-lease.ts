import { useEffect } from "react";
import { markSelfOnline } from "@/api/identity/identity-api";
import { useApiClient } from "@/route/business/api-context";
import { showLocalApiFailure, showLocalCaughtError } from "@/route/business/request-error";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import { useAppStore } from "./session-store";
import { useReadySession } from "./ready-session";
import { useTeamSelection } from "./use-active-team";

const LEASE_RENEW_INTERVAL_MS = 5 * 60 * 1000;

export function useTeamOnlineLease(): void {
  const api = useApiClient();
  const { generation } = useReadySession();
  const selection = useTeamSelection();
  const teamId = selection.status === "ready" ? selection.activeTeamId : null;
  const showToast = useToastStore((state) => state.showToast);

  useEffect(() => {
    if (teamId === null) return;
    let active = true;
    let pending: AbortController | null = null;

    const isCurrent = (): boolean => {
      const current = useAppStore.getState();
      return active && current.generation === generation && current.selectedTeamId === teamId;
    };

    const renew = async (): Promise<void> => {
      if (!isCurrent() || pending !== null) return;
      const request = new AbortController();
      pending = request;
      try {
        const result = await markSelfOnline(api, teamId, request.signal);
        if (!isCurrent() || request.signal.aborted) return;
        if (!result.success) {
          showLocalApiFailure(result, showToast, "在线状态更新失败，请检查网络");
          console.error("[TeamOnline] 刷新在线状态失败", result);
        }
      } catch (error) {
        if (!isCurrent() || request.signal.aborted) return;
        showLocalCaughtError(error, showToast, "在线状态更新失败，请检查网络");
        console.error("[TeamOnline] 刷新在线状态失败", error);
      } finally {
        pending = null;
      }
    };

    const handleVisibilityChange = (): void => {
      if (document.visibilityState === "visible") void renew();
    };

    void renew();
    const intervalId = window.setInterval(() => void renew(), LEASE_RENEW_INTERVAL_MS);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      active = false;
      pending?.abort();
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [api, generation, teamId, showToast]);
}
