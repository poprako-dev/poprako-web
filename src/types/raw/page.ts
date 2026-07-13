import type {
  PageInfo,
  PageCreationResult,
  ReserveChapterPagesArgs,
  ReserveChapterPagesResult,
} from "../page";
import { ensureHttpsUrl } from "@/utils/url";

export type RawPageInfo = {
  id: string;
  chapter_id: string;
  image_url: string | null;
  image_thumbnail_url?: string | null;
  image_uploaded?: boolean;
  creator_id?: string;
  index: number;
  proofread_unit_count: number;
  total_unit_count: number;
  translated_unit_count: number;
  created_at: number;
  updated_at: number;
};

export function unwrapRawPageInfo(raw: RawPageInfo): PageInfo {
  return {
    id: raw.id,
    index: raw.index,
    totalUnitCount: raw.total_unit_count,
    translatedUnitCount: raw.translated_unit_count,
    proofreadUnitCount: raw.proofread_unit_count,
    chapterId: raw.chapter_id,
    imageUrl: ensureHttpsUrl(raw.image_url),
    imageThumbnailUrl: ensureHttpsUrl(raw.image_thumbnail_url),
    isUploaded: raw.image_uploaded ?? false,
    creatorId: raw.creator_id ?? "",
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  } as PageInfo;
}

export type RawPageCreationResult = {
  page_id: string;
  put_url: string;
  image_version: number;
};
export function unwrapRawPageCreationResult(
  raw: RawPageCreationResult,
): PageCreationResult {
  return {
    pageId: raw.page_id,
    putUrl: raw.put_url,
    imageVersion: raw.image_version,
  };
}

export type RawReserveChapterPagesArgs = {
  chapter_id: string;
  page_count: number;
  file_ext: string;
};
export function unwrapRawReserveChapterPagesArgs(
  raw: RawReserveChapterPagesArgs,
): ReserveChapterPagesArgs {
  return {
    chapterId: raw.chapter_id,
    pageCount: raw.page_count,
    fileExtension: raw.file_ext,
  };
}

export type RawReserveChapterPagesResult = {
  creations: RawPageCreationResult[];
};
export function unwrapRawReserveChapterPagesResult(
  raw: RawReserveChapterPagesResult,
): ReserveChapterPagesResult {
  return {
    creations: raw.creations.map((c) => unwrapRawPageCreationResult(c)),
  };
}

export type RawUpdatePageArgs = { id: string; is_uploaded?: boolean };
export function unwrapRawUpdatePageArgs(raw: RawUpdatePageArgs) {
  return { id: raw.id, isUploaded: raw.is_uploaded };
}

export type RawDeleteChapterPagesArgs = { chapter_id: string };
export function wrapDeleteChapterPagesArgs(chapterId: string): RawDeleteChapterPagesArgs {
  return { chapter_id: chapterId };
}
