export type UserInfo = {
  id: string;

  qq: string;
  name: string;

  avatarUrl: string;
  avatarThumbnailUrl?: string;

  isSuperAdmin: boolean;

  lastActiveAt: number;
  createdAt: number;
  updatedAt: number;
};

export type ReserveUserAvatarResult = import("./image").ImageUploadSlot | null;
