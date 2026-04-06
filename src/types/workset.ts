import type { RawWorksetInfo } from "./raw/workset";
import { toTeamInfo, type TeamInfo } from "./team";

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

export function toWorksetInfo(raw?: RawWorksetInfo) {
  if (!raw) return undefined;

  return {
    id: raw.id,
    teamId: raw.team_id,
    team: toTeamInfo(raw.team),
    index: raw.index,
    name: raw.name,
    description: raw.description,
    comicCount: raw.comic_count,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  } as WorksetInfo;
}
