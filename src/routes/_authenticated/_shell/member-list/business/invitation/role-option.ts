import { unmaskRoles } from "@/routes/business/identity/role";

export type RoleConfig = {
  roleKey: string;
  label: string;
  value: number;
  /**
  Applied to the toggle button when selected.
  */
  activeClass: string;
  /**
  Applied to the small label chip on pending invitation cards.
  */
  chipClass: string;
};

export const ROLE_CONFIG: RoleConfig[] = [
  {
    roleKey: "rawProvider",
    label: "图源",
    value: 1,
    activeClass: "bg-amber-50 text-amber-500 border-amber-200",
    chipClass: "bg-amber-50 text-amber-500 border-amber-100",
  },
  {
    roleKey: "translator",
    label: "翻译",
    value: 2,
    activeClass: "bg-sky-50 text-sky-500 border-sky-200",
    chipClass: "bg-sky-50 text-sky-500 border-sky-100",
  },
  {
    roleKey: "proofreader",
    label: "校对",
    value: 4,
    activeClass: "bg-emerald-50 text-emerald-500 border-emerald-200",
    chipClass: "bg-emerald-50 text-emerald-500 border-emerald-100",
  },
  {
    roleKey: "typesetter",
    label: "嵌字",
    value: 8,
    activeClass: "bg-violet-50 text-violet-500 border-violet-200",
    chipClass: "bg-violet-50 text-violet-500 border-violet-100",
  },
  {
    roleKey: "redrawer",
    label: "美工",
    value: 16,
    activeClass: "bg-pink-50 text-pink-500 border-pink-200",
    chipClass: "bg-pink-50 text-pink-500 border-pink-100",
  },
  {
    roleKey: "reviewer",
    label: "监修",
    value: 32,
    activeClass: "bg-indigo-50 text-indigo-400 border-indigo-200",
    chipClass: "bg-indigo-50 text-indigo-400 border-indigo-100",
  },
  {
    roleKey: "publisher",
    label: "发布",
    value: 64,
    activeClass: "bg-rose-50 text-rose-400 border-rose-200",
    chipClass: "bg-rose-50 text-rose-400 border-rose-100",
  },
  {
    roleKey: "admin",
    label: "管理",
    value: 128,
    activeClass: "bg-surface-hover text-muted-foreground border-border",
    chipClass: "bg-surface-hover text-muted-foreground border-border",
  },
];

const ROLE_CONFIG_BY_KEY = Object.fromEntries(ROLE_CONFIG.map((r) => [r.roleKey, r]));

export function getRoleConfigs(roleMask: number): RoleConfig[] {
  return unmaskRoles(roleMask)
    .map((key) => ROLE_CONFIG_BY_KEY[key])
    .filter((role): role is RoleConfig => role !== undefined);
}
