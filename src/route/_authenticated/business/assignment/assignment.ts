import type { ChapterInfo } from "@/route/_authenticated/business/chapter/chapter";
import { unmaskWorkerRoles, type WorkerRole } from "@/route/business/identity/role";
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

export function assignmentRoles(assignment: AssignmentInfo): WorkerRole[] {
  return unmaskWorkerRoles(assignment.roles);
}
