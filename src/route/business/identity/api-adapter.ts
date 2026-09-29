import type { ApiMember, ApiTeam, ApiUser } from "@/api/identity-contract";
import type { MemberInfo } from "@/route/business/identity/member";
import type { TeamInfo } from "@/route/business/identity/team";
import type { UserInfo } from "@/route/business/identity/user";
import { ensureHttpsUrl } from "@/shared/utility/url";

export function toUserInfo(user: ApiUser): UserInfo {
  return {
    id: user.id,
    qq: user.qid,
    name: user.nickname,
    avatarUrl: ensureHttpsUrl(user.avatarUrl),
    avatarThumbnailUrl: ensureHttpsUrl(user.avatarThumbnailUrl),
    isSuperAdmin: user.isSadmin,
    lastActiveAt: user.lastActiveAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function toTeamInfo(team: ApiTeam): TeamInfo {
  return {
    id: team.id,
    name: team.name,
    description: team.description,
    avatarUrl: ensureHttpsUrl(team.avatarUrl),
    avatarThumbnailUrl: ensureHttpsUrl(team.avatarThumbnailUrl),
    createdAt: team.createdAt,
    updatedAt: team.updatedAt,
  };
}

export function toMemberInfo(member: ApiMember): MemberInfo {
  return {
    id: member.id,
    userId: member.userId,
    ...(member.user ? { user: toUserInfo(member.user) } : {}),
    teamId: member.teamId,
    ...(member.team ? { team: toTeamInfo(member.team) } : {}),
    roles: member.roles,
  };
}
