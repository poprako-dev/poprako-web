import type { TeamInfo } from "./team";
import type { UserInfo } from "./user";

export type MemberInfo = {
  id: string;

  userId: string;
  user?: UserInfo;

  teamId: string;
  team?: TeamInfo;

  assignedRawProviderAt?: number;
  assignedTranslatorAt?: number;
  assignedProofreaderAt?: number;
  assignedTypesetterAt?: number;
  assignedReviewerAt?: number;
  assignedPublisherAt?: number;
  assignedAdminAt?: number;

  roles: number;
  createdAt: number;
  updatedAt: number;
};
