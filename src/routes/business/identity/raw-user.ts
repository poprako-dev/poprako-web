import type { AllocUserAvatarResult, UserInfo } from "@/routes/business/identity/user";
import { ensureHttpsUrl } from "@/shared/utility/url";
import {
  type RawAllocImageResult,
  unwrapRawImageUploadSlot,
} from "@/routes/business/identity/raw-image";

export type RawUserInfo = {
  id: string;
  qid: string;
  nickname: string;
  avatar_url: string | null;
  avatar_thumbnail_url?: string | null | undefined;
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
    isSuperAdmin: raw.is_sadmin,
    lastActiveAt: raw.last_active_at,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

export type RawAllocUserAvatarResult = RawAllocImageResult;

export function unwrapRawAllocUserAvatarResult(
  raw: RawAllocUserAvatarResult,
): AllocUserAvatarResult {
  return raw.slot === null ? null : unwrapRawImageUploadSlot(raw.slot);
}
