import type { ImageUploadSlot } from "@/route/business/identity/image";

export type TeamInfo = {
  id: string;

  name: string;
  description: string;

  avatarUrl: string;
  avatarThumbnailUrl?: string | undefined;

  createdAt: number;
  updatedAt: number;
};

export type CreateTeamArgs = {
  name: string;
  description: string;
};
export type CreateTeamResult = {
  id: string;
};

export type UpdateTeamArgs = {
  id: string;
  name?: string | undefined;
  description?: string | undefined;
};

export type AllocTeamAvatarResult = ImageUploadSlot | null;

export function teamAvatarUrl(team: TeamInfo): string | null {
  if (team.avatarThumbnailUrl) {
    return team.avatarThumbnailUrl;
  }
  if (team.avatarUrl) {
    return team.avatarUrl;
  }
  return null;
}
