export type TeamInfo = {
  id: string;

  name: string;
  description: string;

  avatarUrl: string;
  isAvatarUploaded: boolean;

  createdAt: number;
  updatedAt: number;
};

export type CreateTeamArgs = { name: string; description: string };
export type CreateTeamResult = { id: string };

export type UpdateTeamArgs = {
  id: string;
  name?: string;
  description?: string;
};

export type ReserveTeamAvatarResult = {
  avatarOssKey: string;
  putUrl: string;
};

export function teamAvatarUrl(team: TeamInfo) {
  if (team.isAvatarUploaded && team.avatarUrl) return team.avatarUrl;
  return null;
}
