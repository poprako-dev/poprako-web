import { LayoutDashboard, Users, BookOpen, Settings } from "lucide-react";
import type { NavConfig, TeamConfig } from "../types/types";

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
];

export const footerNavConfig: NavConfig = {
  id: "settings",
  label: "全局设置",
  icon: Settings,
  path: "/settings",
};

// 本轮使用静态配置，后续升级为 store + API 加载
export const teamConfigs: TeamConfig[] = [
  {
    id: "xk",
    name: "星空汉化组",
    short: "XK",
    desc: "专注二次元翻译",
  },
  {
    id: "mh",
    name: "迷幻汉化组",
    short: "MH",
    desc: "硬核动作游戏汉化",
  },
  {
    id: "sy",
    name: "深渊汉化组",
    short: "SY",
    desc: "独立游戏爱好者",
  },
];
