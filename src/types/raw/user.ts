import type { UserInfo, ReserveUserAvatarResult } from "../user";
import { ensureHttpsUrl } from "@/utils/url";

export type RawUserInfo = {
  id: string;
  qid: string;
  nickname: string;
  avatar_url: string | null;
  avatar_thumbnail_url?: string | null;
  avatar_uploaded: boolean;
  is_sadmin: boolean;
  last_active_at: number;
  created_at: number;
  updated_at: number;
};

export function unwrapRawUserInfo(raw: RawUserInfo): UserInfo {
  return {
    id: raw.id,
    qq: raw.qid,
    name: raw.nickname,
    avatarUrl: ensureHttpsUrl(raw.avatar_url),
    avatarThumbnailUrl: ensureHttpsUrl(raw.avatar_thumbnail_url),
    isAvatarUploaded: raw.avatar_uploaded,
    isSuperAdmin: raw.is_sadmin,
    lastActiveAt: raw.last_active_at,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  } as UserInfo;
}

export type RawReserveUserAvatarResult = {
  put_url: string;
  avatar_version: number;
};

export function unwrapRawReserveUserAvatarResult(
  raw: RawReserveUserAvatarResult,
): ReserveUserAvatarResult {
  return {
    putUrl: raw.put_url,
    avatarVersion: raw.avatar_version,
  };
}
