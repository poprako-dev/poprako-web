import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useTeamOnlineLease } from "@/routes/business/session/use-team-online-lease";
import { ensureSession } from "@/routes/business/session/session";
import { useAppStore } from "@/routes/business/session/session-store";
import { showLocalCaughtError } from "@/routes/business/request-error";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    const session = useAppStore.getState();
    const generation = session.generation;
    const hadToken = Boolean(session.accessToken);
    try {
      await ensureSession();
    } catch (error) {
      const current = useAppStore.getState();
      if (hadToken && current.accessToken && current.generation === generation) {
        const { showToast } = useToastStore.getState();
        showLocalCaughtError(error, showToast, "无法恢复登录状态");
        console.error("[Session] 无法恢复登录状态:", error);
      }
      // TanStack redirects are control-flow values consumed by the router.
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw redirect({ to: "/login", replace: true });
    }
  },
  component: AuthenticatedRoot,
});

function AuthenticatedRoot(): ReactElement {
  useTeamOnlineLease();
  return <Outlet />;
}
