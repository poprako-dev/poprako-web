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

  // New API format: role_mask as a bitmask number
  role_mask?: number;

  // Legacy individual timestamp fields (kept for backward compatibility)
  assigned_raw_provider_at?: number;
  assigned_translator_at?: number;
  assigned_proofreader_at?: number;
  assigned_typesetter_at?: number;
  assigned_redrawer_at?: number;
  assigned_reviewer_at?: number;
  assigned_publisher_at?: number;
  // Note: assignments do not carry an admin bit (bit 7 is MemberInfo-only)

  created_at: number;
  updated_at: number;
};

export function unwrapRawAssignmentInfo(
  raw: RawAssignmentInfo,
): AssignmentInfo {
  // When the API returns a `role_mask` bitmask, derive individual role
  // timestamps from it. Use `created_at` as the timestamp value so the
  // fields are truthy. Fall back to legacy individual fields when `role_mask`
  // is absent.
  let assignedRawProviderAt = raw.assigned_raw_provider_at;
  let assignedTranslatorAt = raw.assigned_translator_at;
  let assignedProofreaderAt = raw.assigned_proofreader_at;
  let assignedTypesetterAt = raw.assigned_typesetter_at;
  let assignedRedrawerAt = raw.assigned_redrawer_at;
  let assignedReviewerAt = raw.assigned_reviewer_at;
  let assignedPublisherAt = raw.assigned_publisher_at;

  if (raw.role_mask !== undefined && raw.role_mask !== null) {
    const roles = unmaskRoles(raw.role_mask);
    const ts = raw.created_at;
    if (roles.includes("rawProvider")) assignedRawProviderAt = ts;
    if (roles.includes("translator")) assignedTranslatorAt = ts;
    if (roles.includes("proofreader")) assignedProofreaderAt = ts;
    if (roles.includes("typesetter")) assignedTypesetterAt = ts;
    if (roles.includes("redrawer")) assignedRedrawerAt = ts;
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
    assignedRedrawerAt,
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
