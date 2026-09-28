import { type RawTeamInfo, unwrapRawTeamInfo } from "@/routes/business/identity/raw-team";
import type { WorksetInfo } from "@/routes/_authenticated/business/workset/workset";

export type RawWorksetInfo = {
  id: string;

  team_id: string;
  team?: RawTeamInfo | undefined;

  index: number;
  comic_count: number;

  name: string;
  description: string;

  created_at: number;
  updated_at: number;
};

export function unwrapRawWorksetInfo(raw: RawWorksetInfo): WorksetInfo {
  return {
    id: raw.id,
    teamId: raw.team_id,
    team: raw.team ? unwrapRawTeamInfo(raw.team) : undefined,
    index: raw.index,
    name: raw.name,
    description: raw.description,
    comicCount: raw.comic_count,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}
