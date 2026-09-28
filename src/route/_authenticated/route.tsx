import { createFileRoute, Navigate, Outlet, redirect } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { ReadySessionProvider } from "@/route/business/session/ReadySessionProvider";
import { useTeamOnlineLease } from "@/route/business/session/use-team-online-lease";
import { clearSession, ensureSession } from "@/route/business/session/session";
import { useAppStore } from "@/route/business/session/session-store";
import type { ReadySession } from "@/route/business/session/ready-session";
import { showLocalCaughtError } from "@/route/business/request-error";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ context }) => {
    const session = useAppStore.getState();
    const generation = session.generation;
    const hadToken = Boolean(session.accessToken);
    try {
      await ensureSession(context.api);
    } catch (error) {
      const current = useAppStore.getState();
      if (hadToken && current.accessToken && current.generation === generation) {
        const { showToast } = useToastStore.getState();
        showLocalCaughtError(error, showToast, "无法恢复登录状态");
        console.error("[Session] 无法恢复登录状态:", error);
        if (
          typeof error === "object" &&
          error !== null &&
          "httpStatus" in error &&
          error.httpStatus === 401
        ) {
          clearSession();
        }
      }
      // TanStack redirects are control-flow values consumed by the router.
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw redirect({ to: "/login", replace: true });
    }
  },
  component: AuthenticatedRoot,
});

function AuthenticatedRoot(): ReactElement {
  const loginState = useAppStore((state) => state.loginState);
  const generation = useAppStore((state) => state.generation);
  if (!loginState) return <Navigate to="/login" replace />;
  const readySession: ReadySession = { ...loginState, generation };
  return (
    <ReadySessionProvider value={readySession}>
      <AuthenticatedContents />
    </ReadySessionProvider>
  );
}

function AuthenticatedContents(): ReactElement {
  useTeamOnlineLease();
  return <Outlet />;
}
