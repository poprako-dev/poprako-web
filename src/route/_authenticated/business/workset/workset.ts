import type { TeamInfo } from "@/route/business/identity/team";

export type WorksetInfo = {
  id: string;

  teamId: string;
  team?: TeamInfo | undefined;

  index: number;
  name: string;
  description: string;
  comicCount: number;

  createdAt: number;
  updatedAt: number;
};
