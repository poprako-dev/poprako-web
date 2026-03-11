import type {
  ComicInfo,
  CreateComicArgs,
  CreateComicResult,
  UpdateComicArgs,
} from "../comic";

export type RawComicInfo = {
  id: string;
  title: string;
  author: string;
  description: string;
  creator_id: string;
  index: number;
  chapter_count: number;
  cover_url: string;
  last_active_at: number;
  created_at: number;
  updated_at: number;
};

export function unwrapRawComicInfo(raw: RawComicInfo): ComicInfo {
  return {
    id: raw.id,
    title: raw.title,
    author: raw.author,
    description: raw.description,
    creatorId: raw.creator_id,
    index: raw.index,
    chapterCount: raw.chapter_count,
    coverUrl: raw.cover_url,
    lastActiveAt: raw.last_active_at,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  } as ComicInfo;
}

export type RawCreateComicArgs = {
  author: string;
  description: string;
  team_id: string;
  title: string;
};
export function unwrapRawCreateComicArgs(
  raw: RawCreateComicArgs,
): CreateComicArgs {
  return {
    teamId: raw.team_id,
    title: raw.title,
    author: raw.author,
    description: raw.description,
  } as CreateComicArgs;
}

export type RawCreateComicResult = { id: string };
export function unwrapRawCreateComicResult(
  raw: RawCreateComicResult,
): CreateComicResult {
  return { id: raw.id };
}

export type RawUpdateComicArgs = {
  id: string;
  title?: string;
  author?: string;
  description?: string;
};
export function unwrapRawUpdateComicArgs(
  raw: RawUpdateComicArgs,
): UpdateComicArgs {
  return {
    id: raw.id,
    title: raw.title,
    author: raw.author,
    description: raw.description,
  } as UpdateComicArgs;
}
