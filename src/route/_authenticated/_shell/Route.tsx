import clsx from "clsx";
import { useEffect, useState, type ReactElement } from "react";
import { BookOpen, LayoutDashboard, Mail, Settings, Users } from "lucide-react";
import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { AppSidebar } from "@/route/_authenticated/_shell/business/navigation/AppSidebar";
import { useMailStore } from "@/route/_authenticated/_shell/business/mail/mail-store";
import { useApiClient } from "@/route/business/api-context";
import { FirstRegistrationGuideDialog } from "@/route/_authenticated/_shell/business/first-registration/FirstRegistrationGuideDialog";
import {
  readFirstRegistrationFlag,
  writeFirstRegistrationFlag,
} from "@/route/business/onboarding/storage";

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
  const hasUnread = useMailStore((state) => state.mails.some((mail) => !mail.isRead));
  return (
    <nav
      className={clsx(
        "fixed bottom-0 left-0 right-0 z-50 sm:hidden",
        "flex h-14 items-center justify-around",
        "bg-navigation-paper/95 backdrop-blur-sm border-t border-line-stone-200",
      )}
    >
      {mobileNavItems.map((item) => {
        const active = pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            className={clsx(
              "flex flex-col items-center gap-0.5 px-4 py-1 transition-colors",
              active ? "text-navigation-active" : "text-navigation-muted",
            )}
          >
            <span className="relative">
              <item.icon size={20} strokeWidth={active ? 2.4 : 2} />
              {item.to === "/system-mail" && hasUnread && (
                <span
                  className={clsx(
                    "absolute -top-0.5 -right-0.5",
                    "w-1.5 h-1.5 rounded-full bg-surface-red-400",
                  )}
                />
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
  const client = useApiClient();
  const loadState = useMailStore((state) => state.loadState);
  const loadInitial = useMailStore((state) => state.loadInitial);
  const [showGuide, setShowGuide] = useState(() => !readFirstRegistrationFlag());

  useEffect(() => {
    if (loadState === "idle") void loadInitial(client, 15);
  }, [client, loadInitial, loadState]);

  const closeGuide = (): void => {
    writeFirstRegistrationFlag(true);
    setShowGuide(false);
  };
  return (
    <div className="flex h-[100dvh] overflow-hidden bg-page-paper">
      <AppSidebar />
      <main className={clsx("flex-1 min-h-0 w-full overflow-y-auto", "sm:pl-14", "pb-14 sm:pb-0")}>
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
