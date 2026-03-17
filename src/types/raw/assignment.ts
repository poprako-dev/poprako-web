import type { AssignmentInfo } from "../assignment";
import { unwrapRawChapterDetail, type RawChapterInfo } from "./chapter";
import { unwrapRawUserInfo, type RawUserInfo } from "./user";

export type RawAssignmentInfo = {
  id: string;

  user_id: string;
  user?: RawUserInfo;

  chapter_id: string;
  chapter?: RawChapterInfo;

  assigned_raw_provider_at?: number;
  assigned_translator_at?: number;
  assigned_proofreader_at?: number;
  assigned_typesetter_at?: number;
  assigned_redrawer_at?: number;
  assigned_reviewer_at?: number;
  assigned_publisher_at?: number;

  created_at: number;
  updated_at: number;
};

export function unwrapRawAssignmentInfo(
  raw: RawAssignmentInfo,
): AssignmentInfo {
  return {
    id: raw.id,
    userId: raw.user_id,
    user: raw.user ? unwrapRawUserInfo(raw.user) : undefined,
    chapterId: raw.chapter_id,
    chapter: raw.chapter ? unwrapRawChapterDetail(raw.chapter) : undefined,
    assignedRawProviderAt: raw.assigned_raw_provider_at,
    assignedTranslatorAt: raw.assigned_translator_at,
    assignedProofreaderAt: raw.assigned_proofreader_at,
    assignedTypesetterAt: raw.assigned_typesetter_at,
    assignedRedrawerAt: raw.assigned_redrawer_at,
    assignedReviewerAt: raw.assigned_reviewer_at,
    assignedPublisherAt: raw.assigned_publisher_at,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  } as AssignmentInfo;
}

export type RawListAssignmentArgs = {
  chapter_id: number;
  includes?: string[];
  offset: number;
  limit: number;
};
