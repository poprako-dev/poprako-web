import type { TermbaseInfo } from "../termbase";

export type RawTermbaseInfo = {
  id: string;

  team_id?: string | null;
  comic_id?: string | null;

  name: string;
  description?: string | null;
  term_count: number;

  creator_id: string;
  created_at: number;
  updated_at: number;
};

export function unwrapRawTermbaseInfo(raw: RawTermbaseInfo): TermbaseInfo {
  return {
    id: raw.id,
    teamId: raw.team_id ?? undefined,
    comicId: raw.comic_id ?? undefined,
    name: raw.name,
    description: raw.description ?? undefined,
    termCount: raw.term_count,
    creatorId: raw.creator_id,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}
