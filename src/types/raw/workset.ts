import type { RawTeamInfo } from "./team";

export type RawWorksetInfo = {
  id: string;

  team_id: string;
  team?: RawTeamInfo;

  index: number;
  comic_count: number;

  name: string;
  description: string;

  created_at: number;
  updated_at: number;
};
