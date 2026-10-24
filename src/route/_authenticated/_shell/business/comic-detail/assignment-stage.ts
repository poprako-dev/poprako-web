import type { AssignmentInfo } from "@/route/_authenticated/business/assignment/assignment";
import { hasRole, type WorkerRole } from "@/route/business/identity/role";

export function assignmentRolesForStage(
  assignment: AssignmentInfo | undefined,
  role: WorkerRole,
): WorkerRole[] {
  if (!assignment) {
    return [];
  }
  if (role !== "typesetter") {
    return hasRole(assignment, role) ? [role] : [];
  }

  return (["typesetter", "redrawer"] as WorkerRole[]).filter((candidate) =>
    hasRole(assignment, candidate),
  );
}
