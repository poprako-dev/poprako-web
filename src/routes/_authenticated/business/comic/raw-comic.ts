import type {
  ComicInfo,
  CreateComicArgs,
  CreateComicResult,
  UpdateComicArgs,
} from "@/routes/_authenticated/business/comic/comic";
import { unwrapRawWorksetInfo } from "@/routes/_authenticated/business/workset/raw-workset";
import { type RawUserInfo, unwrapRawUserInfo } from "@/routes/business/identity/raw-user";
import { type RawTeamInfo, unwrapRawTeamInfo } from "@/routes/business/identity/raw-team";
import type { RawWorksetInfo } from "@/routes/_authenticated/business/workset/raw-workset";
import type { RawAssignmentInfo } from "@/routes/_authenticated/business/assignment/raw-assignment";
import type { RawChapterInfo } from "@/routes/_authenticated/business/chapter/raw-chapter";
import { ensureHttpsUrl } from "@/shared/utility/url";

export type RawComicInfo = {
  id: string;

  workset_id: string;
  workset?: RawWorksetInfo | undefined;
  team?: RawTeamInfo | undefined;

  title: string;
  author: string;
  description: string | null;
  index: number;
  chapter_count: number;

  cover_url: string | null;
  cover_thumbnail_url?: string | null | undefined;

  creator_id: string;
  creator?: RawUserInfo | undefined;

  last_active_at: number;
  created_at: number;
  updated_at: number;
};

export type RawListComicInfosPayload = {
  comics: RawComicInfo[];
  pinned_chapters: (RawChapterInfo | null)[];
  pinned_chapter_assignments: RawAssignmentInfo[][];
};

export function unwrapRawComicInfo(raw: RawComicInfo): ComicInfo {
  return {
    id: raw.id,
    worksetId: raw.workset_id,
    workset: raw.workset ? unwrapRawWorksetInfo(raw.workset) : undefined,
    team: raw.team ? unwrapRawTeamInfo(raw.team) : undefined,
    title: raw.title,
    author: raw.author,
    description: raw.description ?? "",
    isCoverUploaded: Boolean(raw.cover_url),
    creatorId: raw.creator_id,
    creator: raw.creator ? unwrapRawUserInfo(raw.creator) : undefined,
    index: raw.index,
    chapterCount: raw.chapter_count,
    coverUrl: ensureHttpsUrl(raw.cover_url),
    coverThumbnailUrl: ensureHttpsUrl(raw.cover_thumbnail_url),
    lastActiveAt: raw.last_active_at,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

export type RawCreateComicArgs = {
  author: string;
  description: string;
  workset_id: string;
  title: string;
  first_chapter_subtitle?: string | undefined;
};
export function unwrapRawCreateComicArgs(raw: RawCreateComicArgs): CreateComicArgs {
  return {
    worksetId: raw.workset_id,
    title: raw.title,
    author: raw.author,
    description: raw.description,
    firstChapterTitle: raw.first_chapter_subtitle,
  };
}

export type RawCreateComicResult = { id: string };
export function unwrapRawCreateComicResult(raw: RawCreateComicResult): CreateComicResult {
  return { id: raw.id };
}

export type RawUpdateComicArgs = {
  id: string;
  title?: string | undefined;
  author?: string | undefined;
  description?: string | undefined;
};
export function unwrapRawUpdateComicArgs(raw: RawUpdateComicArgs): UpdateComicArgs {
  return {
    id: raw.id,
    title: raw.title,
    author: raw.author,
    description: raw.description,
  };
}
