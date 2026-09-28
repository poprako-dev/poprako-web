import clsx from "clsx";
import { useEffect, useState, type ReactElement } from "react";
import { BookOpen, LayoutDashboard, Mail, Settings, Users } from "lucide-react";
import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { AppSidebar } from "@/routes/_authenticated/_shell/business/navigation/AppSidebar";
import { listSysMails } from "@/routes/_authenticated/_shell/business/mail/sys-mail-request";
import { useMailStore } from "@/routes/_authenticated/_shell/business/mail/mail-store";
import { useAppStore } from "@/routes/business/session/session-store";
import { LoadingCircle } from "@/shared/component/LoadingCircle";
import { FirstRegistrationGuideDialog } from "@/routes/_authenticated/_shell/business/first-registration/FirstRegistrationGuideDialog";
import {
  readFirstRegistrationFlag,
  writeFirstRegistrationFlag,
} from "@/routes/business/onboarding/storage";

export const Route = createFileRoute("/_authenticated/_shell")({ component: Shell });

const mobileNavItems = [
  { to: "/workspace", icon: LayoutDashboard, label: "工作区" },
  { to: "/comic-playground", icon: BookOpen, label: "漫画" },
  { to: "/member-list", icon: Users, label: "成员" },
  { to: "/system-mail", icon: Mail, label: "消息" },
  { to: "/settings", icon: Settings, label: "设置" },
] as const;

function MobileBottomNav(): ReactElement {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const hasUnread = useMailStore(
    (state) => state.sysMailCache?.mails.some((mail) => !mail.isRead) ?? false,
  );
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-14 items-center justify-around border-t border-stone-200 bg-[#E8DCC4]/95 backdrop-blur-sm sm:hidden">
      {mobileNavItems.map((item) => {
        const active = pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            className={clsx(
              "flex flex-col items-center gap-0.5 px-4 py-1 transition-colors",
              active ? "text-[#166534]" : "text-[#7A6D63]",
            )}
          >
            <span className="relative">
              <item.icon size={20} strokeWidth={active ? 2.4 : 2} />
              {item.to === "/system-mail" && hasUnread && (
                <span className="absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-red-400" />
              )}
            </span>
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function Shell(): ReactElement {
  const navigate = useNavigate();
  const loginState = useAppStore((state) => state.loginState);
  const cache = useMailStore((state) => state.sysMailCache);
  const [showGuide, setShowGuide] = useState(
    () => loginState !== null && !readFirstRegistrationFlag(),
  );

  useEffect(() => {
    if (cache !== null) {
      return;
    }
    const generation = useAppStore.getState().generation;
    void listSysMails(0, 16).then((result) => {
      if (!result.success) {
        return;
      }
      useMailStore
        .getState()
        .setSysMailCache(
          { mails: result.data.slice(0, 15), hasMore: result.data.length > 15 },
          generation,
        );
    });
  }, [cache]);

  const closeGuide = (): void => {
    writeFirstRegistrationFlag(true);
    setShowGuide(false);
  };
  if (loginState === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingCircle />
      </div>
    );
  }
  return (
    <div className="flex h-[100dvh] overflow-hidden bg-[#FEFDF9]">
      <AppSidebar />
      <main className={clsx("min-h-0 w-full flex-1 overflow-y-auto", "sm:pl-14 pb-14 sm:pb-0")}>
        <Outlet />
      </main>
      <MobileBottomNav />
      {showGuide && (
        <FirstRegistrationGuideDialog
          onClose={closeGuide}
          onOpenSettings={() => {
            closeGuide();
            void navigate({ to: "/settings" });
          }}
        />
      )}
    </div>
  );
}
