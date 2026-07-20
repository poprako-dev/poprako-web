import type {
  PageInfo,
  ReservedPage,
  ReserveChapterPagesArgs,
  ReserveChapterPagesResult,
} from "../page";
import { ensureHttpsUrl } from "@/utils/url";

export type RawPageInfo = {
  id: string;
  chapter_id: string;
  image_url: string | null;
  image_thumbnail_url?: string | null;
  image_hash: string;
  byte_length: number;
  extension: string;
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
    isUploaded: !!raw.image_url,
    imageHash: raw.image_hash,
    byteLength: raw.byte_length,
    extension: raw.extension,
    creatorId: "",
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  } as PageInfo;
}

export type RawReservedPage = {
  page_id: string;
  index: number;
  image_hash: string;
  byte_length: number;
  extension: string;
  upload: {
    put_url: string;
    image_version: number;
    headers: Record<string, string>;
  } | null;
};
export function unwrapRawReservedPage(raw: RawReservedPage): ReservedPage {
  return {
    pageId: raw.page_id,
    index: raw.index,
    imageHash: raw.image_hash,
    byteLength: raw.byte_length,
    extension: raw.extension,
    upload: raw.upload === null ? null : {
      putUrl: raw.upload.put_url,
      imageVersion: raw.upload.image_version,
      headers: raw.upload.headers,
    },
  };
}

export type RawReserveChapterPagesArgs = {
  chapter_id: string;
  pages: Array<{
    page_id?: string;
    image_hash: string;
    byte_length: number;
    extension: string;
  }>;
};
export function unwrapRawReserveChapterPagesArgs(
  raw: RawReserveChapterPagesArgs,
): ReserveChapterPagesArgs {
  return {
    chapterId: raw.chapter_id,
    pages: raw.pages.map((page) => ({
      pageId: page.page_id,
      imageHash: page.image_hash,
      byteLength: page.byte_length,
      extension: page.extension,
    })),
  };
}

export type RawReserveChapterPagesResult = {
  pages: RawReservedPage[];
};
export function unwrapRawReserveChapterPagesResult(
  raw: RawReserveChapterPagesResult,
): ReserveChapterPagesResult {
  return {
    pages: raw.pages.map(unwrapRawReservedPage),
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
