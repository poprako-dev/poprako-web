export type ApiUser = {
  id: string;
  qid: string;
  nickname: string;
  avatarUrl?: string | null | undefined;
  avatarThumbnailUrl?: string | null | undefined;
  isSadmin: boolean;
  lastActiveAt: number;
  createdAt: number;
  updatedAt: number;
};

export type ApiTeam = {
  id: string;
  name: string;
  description: string;
  avatarUrl?: string | null | undefined;
  avatarThumbnailUrl?: string | null | undefined;
  createdAt: number;
  updatedAt: number;
};

export type ApiMember = {
  id: string;
  userId: string;
  teamId: string;
  user?: ApiUser | null | undefined;
  team?: ApiTeam | null | undefined;
  nickname: string;
  lastActiveAt: number;
  roles: number;
};

export type ApiAuthResult = { token: string; userId: string };
