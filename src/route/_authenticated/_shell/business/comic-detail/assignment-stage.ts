import type { AssignmentInfo } from "@/route/_authenticated/business/assignment/assignment";
import { hasRole, type Role } from "@/route/business/identity/role";

export function assignmentRolesForStage(
  assignment: AssignmentInfo | undefined,
  role: Role,
): Role[] {
  if (!assignment) {
    return [];
  }
  if (role !== "typesetter") {
    return hasRole(assignment, role) ? [role] : [];
  }

  return (["typesetter", "redrawer"] as Role[]).filter((candidate) =>
    hasRole(assignment, candidate),
  );
}
