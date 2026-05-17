export type UserInfo = {
  id: string;

  qq: string;
  name: string;

  avatarUrl: string;
  isAvatarUploaded: boolean;

  isSuperAdmin: boolean;

  lastActiveAt: number;
  createdAt: number;
  updatedAt: number;
};

export type ReserveUserAvatarResult = {
  putUrl: string;
};
