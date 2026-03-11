import type {
  ChapterDetail,
  CreateChapterArgs,
  CreateChapterResult,
  UpdateChapterArgs,
} from "../chapter";

export type RawChapterDetail = {
  id: string;
  chapter_no: string;
  comic_id: string;
  creator_id: string;
  cover_url: string;
  index: number;
  page_count: number;
  total_unit_count: number;
  translated_unit_count: number;
  proofread_unit_count: number;
  created_at: number;
  updated_at: number;
  uploaded_at?: number;
  transalating_at?: number;
  translated_at?: number;
  typeset_at?: number;
  typesetting_at?: number;
  proofread_at?: number;
  proofreading_at?: number;
  reviewed_at?: number;
  published_at?: number;
};

export function unwrapRawChapterDetail(raw: RawChapterDetail): ChapterDetail {
  return {
    id: raw.id,
    chapterNo: raw.chapter_no,
    comicId: raw.comic_id,
    creatorId: raw.creator_id,
    coverUrl: raw.cover_url,
    index: raw.index,
    pageCount: raw.page_count,
    totalUnitCount: raw.total_unit_count,
    translatedUnitCount: raw.translated_unit_count,
    proofreadUnitCount: raw.proofread_unit_count,
    uploadedAt: raw.uploaded_at,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    transalatingAt: raw.transalating_at,
    translatedAt: raw.translated_at,
    typesetAt: raw.typeset_at,
    typesettingAt: raw.typesetting_at,
    proofreadAt: raw.proofread_at,
    proofreadingAt: raw.proofreading_at,
    reviewedAt: raw.reviewed_at,
    publishedAt: raw.published_at,
  } as ChapterDetail;
}

export type RawCreateChapterArgs = { chapter_no: string; comic_id: string };
export function unwrapRawCreateChapterArgs(
  raw: RawCreateChapterArgs,
): CreateChapterArgs {
  return {
    comicId: raw.comic_id,
    chapterNo: raw.chapter_no,
  } as CreateChapterArgs;
}

export type RawCreateChapterResult = { id: string };
export function unwrapRawCreateChapterResult(
  raw: RawCreateChapterResult,
): CreateChapterResult {
  return { id: raw.id };
}

export type RawUpdateChapterArgs = {
  chapter_id: string;
  chapter_no?: string;
  proofread_status?: string;
  publish_status?: string;
  review_status?: string;
  translate_status?: string;
  typeset_status?: string;
  upload_status?: string;
};

export function unwrapRawUpdateChapterArgs(
  raw: RawUpdateChapterArgs,
): UpdateChapterArgs {
  return {
    chapterId: raw.chapter_id,
    chapterNo: raw.chapter_no,
    translateStatus: raw.translate_status as any,
    typesetStatus: raw.typeset_status as any,
    reviewStatus: raw.review_status as any,
    proofreadStatus: raw.proofread_status as any,
    publishStatus: raw.publish_status as any,
    uploadStatus: raw.upload_status as any,
  } as UpdateChapterArgs;
}
