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

  roles: number;

  created_at: number;
  updated_at: number;
};

export function unwrapRawAssignmentInfo(
  raw: RawAssignmentInfo,
): AssignmentInfo {
  const roles = unmaskRoles(raw.roles);
  const ts = raw.created_at;

  return {
    id: raw.id,
    userId: raw.user_id,
    user: raw.user ? unwrapRawUserInfo(raw.user) : undefined,
    chapterId: raw.chapter_id,
    chapter: raw.chapter ? unwrapRawChapterDetail(raw.chapter) : undefined,
    assignedRawProviderAt: roles.includes("rawProvider") ? ts : undefined,
    assignedTranslatorAt: roles.includes("translator") ? ts : undefined,
    assignedProofreaderAt: roles.includes("proofreader") ? ts : undefined,
    assignedTypesetterAt: roles.includes("typesetter") ? ts : undefined,
    assignedRedrawerAt: roles.includes("redrawer") ? ts : undefined,
    assignedReviewerAt: roles.includes("reviewer") ? ts : undefined,
    assignedPublisherAt: roles.includes("publisher") ? ts : undefined,
    assignedAdminAt: roles.includes("admin") ? ts : undefined,
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
