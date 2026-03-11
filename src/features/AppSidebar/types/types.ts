import type { LucideIcon } from "lucide-react";

export type NavId =
  | "workspace"
  | "comic-playground"
  | "member-list"
  | "settings";

export type NavConfig = {
  id: NavId;
  path: string;
  label: string;
  icon: LucideIcon;
};

export type TeamConfig = {
  id: string;
  name: string;
  short: string;
  desc: string;
};
