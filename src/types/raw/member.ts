import type { MemberInfo } from "../member";
import { unmaskRoles } from "../role";
import type { RawTeamInfo } from "./team";

export type RawMemberInfo = {
  id: string;
  user_id: string;
  team_id: string;
  user?: {
    id: string;
    qq: string;
    nickname: string;
    avatar_url: string;
    avatar_uploaded: boolean;
    is_super_admin: boolean;
    created_at: number;
    updated_at: number;
  };
  team?: RawTeamInfo;
  role_mask: number;
  created_at: number;
  updated_at: number;
};

export function unwrapRawMemberInfo(raw: RawMemberInfo): MemberInfo {
  const unmaskedRoles = unmaskRoles(raw.role_mask);

  return {
    id: raw.id,
    userId: raw.user_id,
    user: raw.user
      ? {
          id: raw.user.id,
          qq: raw.user.qq,
          name: raw.user.nickname,
          avatarUrl: raw.user.avatar_url,
          isAvatarUploaded: raw.user.avatar_uploaded,
          isSuperAdmin: raw.user.is_super_admin,
          createdAt: raw.user.created_at,
          updatedAt: raw.user.updated_at,
        }
      : undefined,
    teamId: raw.team_id,
    team: raw.team
      ? {
          id: raw.team.id,
          name: raw.team.name,
          description: raw.team.description,
          avatarUrl: raw.team.avatar_url,
          isAvatarUploaded: raw.team.avatar_uploaded,
          createdAt: raw.team.created_at,
          updatedAt: raw.team.updated_at,
        }
      : undefined,
    roles: raw.role_mask,
    assignedRawProviderAt: unmaskedRoles.includes("rawProvider")
      ? raw.updated_at
      : undefined,
    assignedTranslatorAt: unmaskedRoles.includes("translator")
      ? raw.updated_at
      : undefined,
    assignedProofreaderAt: unmaskedRoles.includes("proofreader")
      ? raw.updated_at
      : undefined,
    assignedTypesetterAt: unmaskedRoles.includes("typesetter")
      ? raw.updated_at
      : undefined,
    assignedRedrawerAt: unmaskedRoles.includes("redrawer")
      ? raw.updated_at
      : undefined,
    assignedReviewerAt: unmaskedRoles.includes("reviewer")
      ? raw.updated_at
      : undefined,
    assignedPublisherAt: unmaskedRoles.includes("publisher")
      ? raw.updated_at
      : undefined,
    assignedAdminAt: unmaskedRoles.includes("admin") ? raw.updated_at : undefined,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}
