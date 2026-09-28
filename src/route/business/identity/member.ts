import type { TeamInfo } from "@/route/business/identity/team";
import type { UserInfo } from "@/route/business/identity/user";

export type MemberInfo = {
  id: string;

  userId: string;
  user?: UserInfo | undefined;

  teamId: string;
  team?: TeamInfo | undefined;

  roles: number;
  createdAt?: number | undefined;
  updatedAt?: number | undefined;
};
