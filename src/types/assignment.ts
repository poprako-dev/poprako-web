import type { ChapterInfo } from "./chapter";
import { hasRole, type Role } from "./role";
import type { UserInfo } from "./user";

export type AssignmentInfo = {
  id: string;

  chapterId: string;
  chapter?: ChapterInfo;

  userId: string;
  user?: UserInfo;

  assignedRawProviderAt?: number;
  assignedTranslatorAt?: number;
  assignedProofreaderAt?: number;
  assignedTypesetterAt?: number;
  assignedRedrawerAt?: number;
  assignedReviewerAt?: number;
  assignedPublisherAt?: number;
  assignedAdminAt?: number;

  createdAt: number;
  updatedAt: number;
};

const ASSIGNMENT_ROLES: Role[] = [
  "rawProvider",
  "translator",
  "proofreader",
  "typesetter",
  "redrawer",
  "reviewer",
  "publisher",
];

export function assignmentRoles(assignment: AssignmentInfo): Role[] {
  return ASSIGNMENT_ROLES.filter((role) => hasRole(assignment, role));
}
