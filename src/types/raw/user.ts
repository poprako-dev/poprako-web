import type { UserInfo, ReserveUserAvatarResult } from "../user";
import { ensureHttpsUrl } from "@/utils/url";

export type RawUserInfo = {
  id: string;
  qid: string;
  nickname: string;
  avatar_url: string;
  avatar_uploaded: boolean;
  is_super_admin: boolean;
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
    isAvatarUploaded: raw.avatar_uploaded,
    isSuperAdmin: raw.is_super_admin,
    lastActiveAt: raw.last_active_at,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  } as UserInfo;
}

export type RawReserveUserAvatarResult = {
  put_url: string
};

export function unwrapRawReserveUserAvatarResult(
  raw: RawReserveUserAvatarResult,
): ReserveUserAvatarResult {
  return { putUrl: raw.put_url };
}
