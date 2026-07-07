import type { RawTeamInfo } from "./raw/team";
import { ensureHttpsUrl } from "@/utils/url";

export type TeamInfo = {
  id: string;

  name: string;
  description: string;

  avatarUrl: string;
  isAvatarUploaded: boolean;

  createdAt: number;
  updatedAt: number;
};

export function toTeamInfo(raw?: RawTeamInfo) {
  if (!raw) return undefined;

  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    avatarUrl: ensureHttpsUrl(raw.avatar_url),
    isAvatarUploaded: raw.avatar_uploaded,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  } as TeamInfo;
}

export type CreateTeamArgs = { name: string; description: string };
export type CreateTeamResult = { id: string };

export type UpdateTeamArgs = {
  id: string;
  name?: string;
  description?: string;
};

export type ReserveTeamAvatarResult = {
  putUrl: string;
  avatarVersion: number;
};

export function teamAvatarUrl(team: TeamInfo) {
  if (team.isAvatarUploaded && team.avatarUrl) return team.avatarUrl;
  return null;
}
