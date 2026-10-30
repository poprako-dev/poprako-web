import { BookOpen, LayoutDashboard, Mail, Settings, Users, Wrench } from "lucide-react";
import type { NavConfig } from "@/route/_authenticated/_shell/business/navigation/app-sidebar-type";

export const mainNavConfigs: NavConfig[] = [
  {
    id: "workspace",
    label: "个人工作区",
    icon: LayoutDashboard,
    path: "/workspace",
  },
  {
    id: "comic-playground",
    label: "漫画广场",
    icon: BookOpen,
    path: "/comic-playground",
  },
  {
    id: "member-list",
    label: "成员一览",
    icon: Users,
    path: "/member-list",
  },
  {
    id: "system-mail",
    label: "系统信箱",
    icon: Mail,
    path: "/system-mail",
  },
];

export const utilityNavConfig: NavConfig = {
  id: "utilities",
  label: "实用工具",
  icon: Wrench,
  path: "/utilities",
};

export const footerNavConfig: NavConfig = {
  id: "settings",
  label: "全局设置",
  icon: Settings,
  path: "/settings",
};
