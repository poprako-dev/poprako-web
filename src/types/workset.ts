import type { TeamInfo } from "./team";

export type WorksetInfo = {
  id: string;

  teamId: string;
  team?: TeamInfo;

  index: number;
  name: string;
  description: string;
  comicCount: number;

  createdAt: number;
  updatedAt: number;
};
