import type { MemberInfo } from "../member";
import { unmaskRoles } from "../role";
import type { RawTeamInfo } from "./team";
import { ensureHttpsUrl } from "@/utils/url";

export type RawMemberInfo = {
  id: string;
  user_id: string;
  team_id: string;
  user?: {
    id: string;
    qid: string;
    nickname: string;
    avatar_url: string | null;
    avatar_uploaded: boolean;
    is_sadmin: boolean;
    last_active_at: number;
    created_at: number;
    updated_at: number;
  };
  team?: RawTeamInfo;
  nickname?: string;
  last_active_at?: number;
  roles: number;
  created_at?: number;
  updated_at?: number;
};

export function unwrapRawMemberInfo(raw: RawMemberInfo): MemberInfo {
  const unmaskedRoles = unmaskRoles(raw.roles);
  const updatedAt = raw.updated_at ?? raw.last_active_at ?? 0;

  return {
    id: raw.id,
    userId: raw.user_id,
    user: raw.user
      ? {
          id: raw.user.id,
          qq: raw.user.qid,
          name: raw.user.nickname,
          avatarUrl: ensureHttpsUrl(raw.user.avatar_url),
          isAvatarUploaded: raw.user.avatar_uploaded,
          isSuperAdmin: raw.user.is_sadmin,
          lastActiveAt: raw.user.last_active_at,
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
          avatarUrl: ensureHttpsUrl(raw.team.avatar_url),
          isAvatarUploaded: raw.team.avatar_uploaded ?? !!raw.team.avatar_url,
          createdAt: raw.team.created_at,
          updatedAt: raw.team.updated_at,
        }
      : undefined,
    roles: raw.roles,
    assignedRawProviderAt: unmaskedRoles.includes("rawProvider")
      ? updatedAt
      : undefined,
    assignedTranslatorAt: unmaskedRoles.includes("translator")
      ? updatedAt
      : undefined,
    assignedProofreaderAt: unmaskedRoles.includes("proofreader")
      ? updatedAt
      : undefined,
    assignedTypesetterAt: unmaskedRoles.includes("typesetter")
      ? updatedAt
      : undefined,
    assignedRedrawerAt: unmaskedRoles.includes("redrawer")
      ? updatedAt
      : undefined,
    assignedReviewerAt: unmaskedRoles.includes("reviewer")
      ? updatedAt
      : undefined,
    assignedPublisherAt: unmaskedRoles.includes("publisher")
      ? updatedAt
      : undefined,
    assignedAdminAt: unmaskedRoles.includes("admin") ? updatedAt : undefined,
    createdAt: raw.created_at ?? 0,
    updatedAt,
  };
}
