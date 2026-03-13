import type { UserInfo, ReserveUserAvatarResult } from "../user";

export type RawUserInfo = {
  id: string;
  qq: string;
  name: string;
  avatar_url: string;
  is_avatar_uploaded: boolean;
  is_super_admin: boolean;
  created_at: number;
  updated_at: number;
};

export function unwrapRawUserInfo(raw: RawUserInfo): UserInfo {
  return {
    id: raw.id,
    qq: raw.qq,
    name: raw.name,
    avatarUrl: raw.avatar_url,
    isAvatarUploaded: raw.is_avatar_uploaded,
    isSuperAdmin: raw.is_super_admin,
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
