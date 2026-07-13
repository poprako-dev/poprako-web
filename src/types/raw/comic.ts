import type {
  ComicInfo,
  CreateComicArgs,
  CreateComicResult,
  UpdateComicArgs,
} from "../comic";
import { toWorksetInfo } from "../workset";
import type { RawUserInfo } from "./user";
import type { RawWorksetInfo } from "./workset";
import type { RawChapterInfo } from "./chapter";
import { ensureHttpsUrl } from "@/utils/url";

export type RawComicInfo = {
  id: string;

  workset_id: string;
  workset?: RawWorksetInfo;

  title: string;
  author: string;
  description: string;
  index: number;
  chapter_count: number;

  cover_url: string | null;
  cover_thumbnail_url?: string | null;

  creator_id: string;
  creator?: RawUserInfo;

  pinned_chapter?: RawChapterInfo;

  last_active_at: number;
  created_at: number;
  updated_at: number;
};

export function unwrapRawComicInfo(raw: RawComicInfo): ComicInfo {
  return {
    id: raw.id,
    worksetId: raw.workset_id,
    workset: toWorksetInfo(raw.workset),
    title: raw.title,
    author: raw.author,
    description: raw.description,
    isCoverUploaded: !!raw.cover_url,
    creatorId: raw.creator_id,
    index: raw.index,
    chapterCount: raw.chapter_count,
    coverUrl: ensureHttpsUrl(raw.cover_url),
    coverThumbnailUrl: ensureHttpsUrl(raw.cover_thumbnail_url),
    lastActiveAt: raw.last_active_at,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  } as ComicInfo;
}

export type RawCreateComicArgs = {
  author: string;
  description: string;
  workset_id: string;
  title: string;
  first_chapter_subtitle?: string;
};
export function unwrapRawCreateComicArgs(
  raw: RawCreateComicArgs,
): CreateComicArgs {
  return {
    worksetId: raw.workset_id,
    title: raw.title,
    author: raw.author,
    description: raw.description,
    firstChapterTitle: raw.first_chapter_subtitle,
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
