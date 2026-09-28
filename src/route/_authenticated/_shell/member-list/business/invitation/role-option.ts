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
    activeClass: "bg-primary-subtle text-primary-text border-primary-border",
    chipClass: "bg-primary-subtle text-primary-text border-primary-border",
  },
  {
    roleKey: "translator",
    label: "翻译",
    value: 2,
    activeClass: "bg-primary-subtle text-primary-text border-primary-border",
    chipClass: "bg-primary-subtle text-primary-text border-primary-border",
  },
  {
    roleKey: "proofreader",
    label: "校对",
    value: 4,
    activeClass: "bg-primary-subtle text-primary-text border-primary-border",
    chipClass: "bg-primary-subtle text-primary-text border-primary-border",
  },
  {
    roleKey: "typesetter",
    label: "嵌字",
    value: 8,
    activeClass: "bg-primary-subtle text-primary-text border-primary-border",
    chipClass: "bg-primary-subtle text-primary-text border-primary-border",
  },
  {
    roleKey: "redrawer",
    label: "美工",
    value: 16,
    activeClass: "bg-primary-subtle text-primary-text border-primary-border",
    chipClass: "bg-primary-subtle text-primary-text border-primary-border",
  },
  {
    roleKey: "reviewer",
    label: "监修",
    value: 32,
    activeClass: "bg-primary-subtle text-primary-text border-primary-border",
    chipClass: "bg-primary-subtle text-primary-text border-primary-border",
  },
  {
    roleKey: "publisher",
    label: "发布",
    value: 64,
    activeClass: "bg-primary-subtle text-primary-text border-primary-border",
    chipClass: "bg-primary-subtle text-primary-text border-primary-border",
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
