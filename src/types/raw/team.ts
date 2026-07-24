import type {
  TeamInfo,
  CreateTeamArgs,
  CreateTeamResult,
  UpdateTeamArgs,
  ReserveTeamAvatarResult,
} from "../team";
import { ensureHttpsUrl } from "@/utils/url";
import {
  unwrapRawImageUploadSlot,
  type RawReserveImageResult,
} from "./image";

export type RawTeamInfo = {
  id: string;
  name: string;
  description: string;
  avatar_url: string | null;
  avatar_thumbnail_url?: string | null;
  created_at: number;
  updated_at: number;
};

export function unwrapRawTeamInfo(raw: RawTeamInfo): TeamInfo {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    avatarUrl: ensureHttpsUrl(raw.avatar_url),
    avatarThumbnailUrl: ensureHttpsUrl(raw.avatar_thumbnail_url),
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

export type RawReserveTeamAvatarResult = RawReserveImageResult;
export function unwrapRawReserveTeamAvatarResult(
  raw: RawReserveTeamAvatarResult,
): ReserveTeamAvatarResult {
  return raw.slot === null ? null : unwrapRawImageUploadSlot(raw.slot);
}
