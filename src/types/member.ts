import type { TeamInfo } from "./team";

export type MemberWithTeamInfo = {
  id: string;

  userId: string;
  team: TeamInfo;

  assignedAdminAt: number;
  assignedRawProviderAt?: number;
  assignedTranslatorAt?: number;
  assignedProofreaderAt?: number;
  assignedTypesetterAt?: number;
  assignedReviewerAt?: number;
  assignedPublisherAt?: number;
};

export type MemberProfile = {
  id: string;

  qq: string;
  name: string;

  avatarUrl: string;
  isAvatarUploaded: boolean;

  isSuperAdmin: boolean;
  roles: number;

  createdAt: number;
  updatedAt: number;
};

export type CreateMemberArgs = {
  teamId: string;
  userId: string;
  roles: number;
};
export type CreateMemberResult = { memberId: string };

export type UpdateMemberRoleArgs = { id: string; roles: number };

export type JoinTeamArgs = { invitationCode: string };
