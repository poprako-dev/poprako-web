import type {
  TeamInfo,
  CreateTeamArgs,
  CreateTeamResult,
  UpdateTeamArgs,
  ReserveTeamAvatarResult,
} from "../team";
import { ensureHttpsUrl } from "@/utils/url";

export type RawTeamInfo = {
  id: string;
  name: string;
  description: string;
  avatar_url: string;
  avatar_uploaded: boolean;
  created_at: number;
  updated_at: number;
};

export function unwrapRawTeamInfo(raw: RawTeamInfo): TeamInfo {
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

export type RawCreateTeamArgs = { name: string; description: string };
export function unwrapRawCreateTeamArgs(
  raw: RawCreateTeamArgs,
): CreateTeamArgs {
  return { name: raw.name, description: raw.description };
}

export type RawCreateTeamResult = { id: string };
export function unwrapRawCreateTeamResult(
  raw: RawCreateTeamResult,
): CreateTeamResult {
  return { id: raw.id };
}

export type RawUpdateTeamArgs = {
  id: string;
  name?: string;
  description?: string;
};
export function unwrapRawUpdateTeamArgs(
  raw: RawUpdateTeamArgs,
): UpdateTeamArgs {
  return { id: raw.id, name: raw.name, description: raw.description };
}

export type RawReserveTeamAvatarResult = {
  avatar_oss_key: string;
  put_url: string;
};
export function unwrapRawReserveTeamAvatarResult(
  raw: RawReserveTeamAvatarResult,
): ReserveTeamAvatarResult {
  return { avatarOssKey: raw.avatar_oss_key, putUrl: raw.put_url };
}
