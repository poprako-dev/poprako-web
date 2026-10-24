import { describe, expect, test } from "vitest";
import { assignmentRoles, type AssignmentInfo } from "./assignment";
import { roleMask, WORKER_ROLES } from "@/route/business/identity/role";

const reviewAssignment: AssignmentInfo = {
  id: "assignment-1",
  chapterId: "chapter-1",
  userId: "user-1",
  roles: 32,
  createdAt: 1,
  updatedAt: 1,
};

describe("assignment role changes", () => {
  test("leaving review preserves every other worker role", () => {
    const assignment = { ...reviewAssignment, roles: 98 };
    const remaining = assignmentRoles(assignment).filter((role) => role !== "reviewer");
    expect(remaining).toEqual(["translator", "publisher"]);
    expect(roleMask(remaining)).toBe(66);
  });

  test("leaving the last worker role permits deletion", () => {
    const remaining = assignmentRoles(reviewAssignment).filter((role) => role !== "reviewer");
    expect(remaining).toEqual([]);
  });

  test("assigning another worker role preserves existing worker roles", () => {
    expect(roleMask([...assignmentRoles(reviewAssignment), "translator"])).toBe(34);
  });

  test("assignment masks expose only the seven worker roles", () => {
    expect(assignmentRoles({ ...reviewAssignment, roles: 511 })).toEqual(WORKER_ROLES);
  });
});
