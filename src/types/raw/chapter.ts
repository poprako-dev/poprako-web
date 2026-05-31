import type {
  ChapterInfo,
  CreateChapterArgs,
  CreateChapterResult,
  UpdateChapterArgs,
  WorkflowTransition,
} from "../chapter";
import { unwrapRawComicInfo, type RawComicInfo } from "./comic";
import { unwrapRawUserInfo, type RawUserInfo } from "./user";

export type RawChapterInfo = {
  id: string;

  comic_id: string;
  comic?: RawComicInfo;

  creator_id: string;
  creator?: RawUserInfo;

  index: number;
  subtitle: string;

  page_count: number;
  total_unit_count: number;
  translated_unit_count: number;
  proofread_unit_count: number;
  is_pinned?: boolean;

  uploaded_at?: number;
  translating_at?: number;
  translated_at?: number;
  typeset_at?: number;
  typesetting_at?: number;
  proofread_at?: number;
  proofreading_at?: number;
  reviewed_at?: number;
  published_at?: number;

  created_at: number;
  updated_at: number;
};

export function unwrapRawChapterDetail(raw: RawChapterInfo): ChapterInfo {
  return {
    id: raw.id,
    comicId: raw.comic_id,
    comic: raw.comic ? unwrapRawComicInfo(raw.comic) : undefined,
    creatorId: raw.creator_id,
    creator: raw.creator ? unwrapRawUserInfo(raw.creator) : undefined,
    index: raw.index,
    subtitle: raw.subtitle,
    isPinned: raw.is_pinned,
    pageCount: raw.page_count,
    totalUnitCount: raw.total_unit_count,
    translatedUnitCount: raw.translated_unit_count,
    proofreadUnitCount: raw.proofread_unit_count,
    uploadedAt: raw.uploaded_at,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    translatingAt: raw.translating_at,
    translatedAt: raw.translated_at,
    typesetAt: raw.typeset_at,
    typesettingAt: raw.typesetting_at,
    proofreadAt: raw.proofread_at,
    proofreadingAt: raw.proofreading_at,
    reviewedAt: raw.reviewed_at,
    publishedAt: raw.published_at,
  } as ChapterInfo;
}

export type RawCreateChapterArgs = { subtitle?: string; comic_id: string };
export function unwrapRawCreateChapterArgs(
  raw: RawCreateChapterArgs,
): CreateChapterArgs {
  return {
    comicId: raw.comic_id,
    subtitle: raw.subtitle,
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
  subtitle?: string;
  is_pinned?: boolean;
  workflow_transition?: string;
  revert_transition?: string;
};

export function unwrapRawUpdateChapterArgs(
  raw: RawUpdateChapterArgs,
): UpdateChapterArgs {
  return {
    subtitle: raw.subtitle,
    isPinned: raw.is_pinned,
    workflowTransition: raw.workflow_transition as WorkflowTransition | undefined,
    revertTransition: raw.revert_transition as WorkflowTransition | undefined,
  } as UpdateChapterArgs;
}
