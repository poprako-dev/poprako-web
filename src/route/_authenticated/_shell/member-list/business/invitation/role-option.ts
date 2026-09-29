import { unmaskRoles } from "@/route/business/identity/role";

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
    activeClass: "bg-surface-amber-50 text-ink-amber-500 border-line-amber-200",
    chipClass: "bg-surface-amber-50 text-ink-amber-500 border-line-amber-100",
  },
  {
    roleKey: "translator",
    label: "翻译",
    value: 2,
    activeClass: "bg-surface-sky-50 text-ink-sky-500 border-line-sky-200",
    chipClass: "bg-surface-sky-50 text-ink-sky-500 border-line-sky-100",
  },
  {
    roleKey: "proofreader",
    label: "校对",
    value: 4,
    activeClass: "bg-surface-emerald-50 text-ink-emerald-500 border-line-emerald-200",
    chipClass: "bg-surface-emerald-50 text-ink-emerald-500 border-line-emerald-100",
  },
  {
    roleKey: "typesetter",
    label: "嵌字",
    value: 8,
    activeClass: "bg-surface-violet-50 text-ink-violet-500 border-line-violet-200",
    chipClass: "bg-surface-violet-50 text-ink-violet-500 border-line-violet-100",
  },
  {
    roleKey: "redrawer",
    label: "美工",
    value: 16,
    activeClass: "bg-surface-pink-50 text-ink-pink-500 border-line-pink-200",
    chipClass: "bg-surface-pink-50 text-ink-pink-500 border-line-pink-100",
  },
  {
    roleKey: "reviewer",
    label: "监修",
    value: 32,
    activeClass: "bg-surface-indigo-50 text-ink-indigo-400 border-line-indigo-200",
    chipClass: "bg-surface-indigo-50 text-ink-indigo-400 border-line-indigo-100",
  },
  {
    roleKey: "publisher",
    label: "发布",
    value: 64,
    activeClass: "bg-surface-rose-50 text-ink-rose-400 border-line-rose-200",
    chipClass: "bg-surface-rose-50 text-ink-rose-400 border-line-rose-100",
  },
  {
    roleKey: "admin",
    label: "管理",
    value: 128,
    activeClass: "bg-surface-stone-100 text-ink-stone-500 border-line-stone-200",
    chipClass: "bg-surface-stone-100 text-ink-stone-500 border-line-stone-200",
  },
];

const ROLE_CONFIG_BY_KEY = Object.fromEntries(ROLE_CONFIG.map((r) => [r.roleKey, r]));

export function getRoleConfigs(roleMask: number): RoleConfig[] {
  return unmaskRoles(roleMask)
    .map((key) => ROLE_CONFIG_BY_KEY[key])
    .filter((role): role is RoleConfig => role !== undefined);
}
