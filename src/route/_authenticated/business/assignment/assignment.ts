import type { ChapterInfo } from "@/route/_authenticated/business/chapter/chapter";
import { hasRole, type Role } from "@/route/business/identity/role";
import type { UserInfo } from "@/route/business/identity/user";

export type AssignmentInfo = {
  id: string;

  chapterId: string;
  chapter?: ChapterInfo | undefined;

  roles: number;
  userId: string;
  user?: UserInfo | undefined;

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
