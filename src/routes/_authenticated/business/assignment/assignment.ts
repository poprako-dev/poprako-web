import type { ChapterInfo } from "@/routes/_authenticated/business/chapter/chapter";
import { hasRole, type Role } from "@/routes/business/identity/role";
import type { UserInfo } from "@/routes/business/identity/user";

export type AssignmentInfo = {
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
};

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
