import type { ImageUploadSlot } from "@/route/business/identity/image";

export type UserInfo = {
  id: string;

  qq: string;
  name: string;

  avatarUrl: string;
  avatarThumbnailUrl?: string | undefined;

  isSuperAdmin: boolean;

  lastActiveAt: number;
  createdAt: number;
  updatedAt: number;
};

export type AllocUserAvatarResult = ImageUploadSlot | null;
