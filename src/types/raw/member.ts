import type {
  MemberProfile,
  MemberWithTeamInfo,
  CreateMemberArgs,
  CreateMemberResult,
  UpdateMemberRoleArgs,
  JoinTeamArgs,
} from "../member";
import type { RawTeamInfo } from "./team";

export type RawMemberProfile = {
  id: string;
  qq: string;
  name: string;
  avatar_url: string;
  is_avatar_uploaded: boolean;
  is_super_admin: boolean;
  roles: number;
  created_at: number;
  updated_at: number;
};

export function unwrapRawMemberProfile(raw: RawMemberProfile): MemberProfile {
  return {
    id: raw.id,
    qq: raw.qq,
    name: raw.name,
    avatarUrl: raw.avatar_url,
    isAvatarUploaded: raw.is_avatar_uploaded,
    isSuperAdmin: raw.is_super_admin,
    roles: raw.roles,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  } as MemberProfile;
}

export type RawMemberWithTeamInfo = {
  id: string;
  user_id: string;
  team: RawTeamInfo;
  assigned_admin_at: number;
  assigned_raw_provider_at?: number;
  assigned_translator_at?: number;
  assigned_proofreader_at?: number;
  assigned_typesetter_at?: number;
  assigned_reviewer_at?: number;
  assigned_publisher_at?: number;
};

export function unwrapRawMemberWithTeamInfo(
  raw: RawMemberWithTeamInfo,
): MemberWithTeamInfo {
  return {
    id: raw.id,
    userId: raw.user_id,
    team: {
      id: raw.team.id,
      name: raw.team.name,
      description: raw.team.description,
      avatarUrl: raw.team.avatar_url,
      isAvatarUploaded: raw.team.is_avatar_uploaded,
      createdAt: raw.team.created_at,
      updatedAt: raw.team.updated_at,
    },
    assignedAdminAt: raw.assigned_admin_at,
    assignedRawProviderAt: raw.assigned_raw_provider_at,
    assignedTranslatorAt: raw.assigned_translator_at,
    assignedProofreaderAt: raw.assigned_proofreader_at,
    assignedTypesetterAt: raw.assigned_typesetter_at,
    assignedReviewerAt: raw.assigned_reviewer_at,
    assignedPublisherAt: raw.assigned_publisher_at,
  } as MemberWithTeamInfo;
}

export type RawCreateMemberArgs = {
  roles: number;
  team_id: string;
  user_id: string;
};
export function unwrapRawCreateMemberArgs(
  raw: RawCreateMemberArgs,
): CreateMemberArgs {
  return {
    teamId: raw.team_id,
    userId: raw.user_id,
    roles: raw.roles,
  } as CreateMemberArgs;
}

export type RawCreateMemberResult = { member_id: string };
export function unwrapRawCreateMemberResult(
  raw: RawCreateMemberResult,
): CreateMemberResult {
  return { memberId: raw.member_id };
}

export type RawUpdateMemberRoleArgs = { id: string; roles?: number };
export function unwrapRawUpdateMemberRoleArgs(
  raw: RawUpdateMemberRoleArgs,
): UpdateMemberRoleArgs {
  return { id: raw.id, roles: raw.roles || 0 };
}

export type RawJoinTeamArgs = { invitation_code: string };
export function unwrapRawJoinTeamArgs(raw: RawJoinTeamArgs): JoinTeamArgs {
  return { invitationCode: raw.invitation_code };
}
