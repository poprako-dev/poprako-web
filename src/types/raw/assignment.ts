import type { AssignmentInfo } from "../assignment";
import { unmaskRoles } from "../role";
import { unwrapRawChapterDetail, type RawChapterInfo } from "./chapter";
import { unwrapRawUserInfo, type RawUserInfo } from "./user";

export type RawAssignmentInfo = {
  id: string;

  user_id: string;
  user?: RawUserInfo;

  chapter_id: string;
  chapter?: RawChapterInfo;

  // New API format: roles as a bitmask number
  roles?: number;

  // Legacy individual timestamp fields (kept for backward compatibility)
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
  // When the API returns a `roles` bitmask, derive individual role
  // timestamps from it. Use `created_at` as the timestamp value so the
  // fields are truthy. Fall back to legacy individual fields when `roles`
  // is absent.
  let assignedRawProviderAt = raw.assigned_raw_provider_at;
  let assignedTranslatorAt = raw.assigned_translator_at;
  let assignedProofreaderAt = raw.assigned_proofreader_at;
  let assignedTypesetterAt = raw.assigned_typesetter_at;
  let assignedReviewerAt = raw.assigned_reviewer_at;
  let assignedPublisherAt = raw.assigned_publisher_at;

  if (raw.roles !== undefined && raw.roles !== null) {
    const roles = unmaskRoles(raw.roles);
    const ts = raw.created_at;
    if (roles.includes("rawProvider")) assignedRawProviderAt = ts;
    if (roles.includes("translator")) assignedTranslatorAt = ts;
    if (roles.includes("proofreader")) assignedProofreaderAt = ts;
    if (roles.includes("typesetter")) assignedTypesetterAt = ts;
    if (roles.includes("reviewer")) assignedReviewerAt = ts;
    if (roles.includes("publisher")) assignedPublisherAt = ts;
  }

  return {
    id: raw.id,
    userId: raw.user_id,
    user: raw.user ? unwrapRawUserInfo(raw.user) : undefined,
    chapterId: raw.chapter_id,
    chapter: raw.chapter ? unwrapRawChapterDetail(raw.chapter) : undefined,
    assignedRawProviderAt,
    assignedTranslatorAt,
    assignedProofreaderAt,
    assignedTypesetterAt,
    assignedReviewerAt,
    assignedPublisherAt,
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
