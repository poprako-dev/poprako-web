import clsx from "clsx";
import { useEffect, useState } from "react";
import { LayoutDashboard, BookOpen, Users } from "lucide-react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { AppSidebar } from "@/features/AppSidebar";
import { getMyUser } from "@/api/user";
import { listMyMembers } from "@/api/member";
import { useAppStore } from "@/store/app";
import LoadingEllipsis from "@/components/ui/LoadingEllipsis";

const mobileNavItems = [
  { path: "/workspace", icon: LayoutDashboard, label: "工作区" },
  { path: "/comic-playground", icon: BookOpen, label: "漫画广场" },
  { path: "/member-list", icon: Users, label: "成员" },
];

function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav
      className={clsx(
        "fixed bottom-0 left-0 right-0 z-50 sm:hidden",
        "flex h-14 items-center justify-around",
        "bg-white/95 backdrop-blur-sm border-t border-gray-100",
      )}
    >
      {mobileNavItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.path}
            type="button"
            onClick={() => navigate(item.path)}
            className={clsx(
              "flex flex-col items-center gap-0.5 px-4 py-1 transition-colors",
              isActive ? "text-emerald-600" : "text-slate-400",
            )}
          >
            <item.icon size={20} strokeWidth={isActive ? 2.4 : 2} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default function AppLayout() {
  const navigate = useNavigate();
  const loginState = useAppStore((s) => s.loginState);
  const setLoginState = useAppStore((s) => s.setLoginState);
  const [isReady, setIsReady] = useState(loginState !== null);

  useEffect(() => {
    if (loginState !== null) {
      setIsReady(true);
      return;
    }

    Promise.all([getMyUser(), listMyMembers()])
      .then(([userInfo, memberInfos]) => {
        setLoginState({ userInfo, memberInfos });
        setIsReady(true);
      })
      .catch(() => navigate("/login", { replace: true }));
  }, [loginState, navigate, setLoginState]);

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingEllipsis />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <AppSidebar />
      <main className={clsx("w-full sm:pl-14", "pb-14 sm:pb-0")}>
        <Outlet />
      </main>
      <MobileBottomNav />
    </div>
  );
}
