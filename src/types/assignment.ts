import type { ChapterInfo } from "./chapter";
import { hasRole, type Role } from "./role";
import type { UserInfo } from "./user";

export interface AssignmentInfo {
  id: string;

  chapterId: string;
  chapter?: ChapterInfo | undefined;

  userId: string;
  user?: UserInfo | undefined;

  assignedRawProviderAt?: number | undefined;
  assignedTranslatorAt?: number | undefined;
  assignedProofreaderAt?: number | undefined;
  assignedTypesetterAt?: number | undefined;
  assignedRedrawerAt?: number | undefined;
  assignedReviewerAt?: number | undefined;
  assignedPublisherAt?: number | undefined;
  assignedAdminAt?: number | undefined;

  createdAt: number;
  updatedAt: number;
}

const ASSIGNMENT_ROLES: Role[] = [
  "rawProvider",
  "translator",
  "proofreader",
  "typesetter",
  "redrawer",
  "reviewer",
  "publisher",
  "admin",
];

export function assignmentRoles(assignment: AssignmentInfo): Role[] {
  return ASSIGNMENT_ROLES.filter((role) => hasRole(assignment, role));
}
