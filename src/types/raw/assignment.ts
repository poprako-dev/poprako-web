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
  let assignedRawProviderAt: number | undefined;
  let assignedTranslatorAt: number | undefined;
  let assignedProofreaderAt: number | undefined;
  let assignedTypesetterAt: number | undefined;
  let assignedRedrawerAt: number | undefined;
  let assignedReviewerAt: number | undefined;
  let assignedPublisherAt: number | undefined;

  if (raw.role_mask !== undefined && raw.role_mask !== null) {
    const roles = unmaskRoles(raw.role_mask);
    const ts = raw.created_at;
    assignedRawProviderAt = roles.includes("rawProvider") ? ts : undefined;
    assignedTranslatorAt = roles.includes("translator") ? ts : undefined;
    assignedProofreaderAt = roles.includes("proofreader") ? ts : undefined;
    assignedTypesetterAt = roles.includes("typesetter") ? ts : undefined;
    assignedRedrawerAt = roles.includes("redrawer") ? ts : undefined;
    assignedReviewerAt = roles.includes("reviewer") ? ts : undefined;
    assignedPublisherAt = roles.includes("publisher") ? ts : undefined;
  } else {
    assignedRawProviderAt = raw.assigned_raw_provider_at ?? undefined;
    assignedTranslatorAt = raw.assigned_translator_at ?? undefined;
    assignedProofreaderAt = raw.assigned_proofreader_at ?? undefined;
    assignedTypesetterAt = raw.assigned_typesetter_at ?? undefined;
    assignedRedrawerAt = raw.assigned_redrawer_at ?? undefined;
    assignedReviewerAt = raw.assigned_reviewer_at ?? undefined;
    assignedPublisherAt = raw.assigned_publisher_at ?? undefined;
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
  chapter_id: string;
  includes?: string[];
  offset: number;
  limit: number;
};
