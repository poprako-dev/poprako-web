import { describe, expect, test } from "vitest";

import { assignmentRoles, type AssignmentInfo } from "./assignment";
import { roleMask } from "./role";

const reviewAssignment: AssignmentInfo = {
  id: "assignment-1",
  chapterId: "chapter-1",
  userId: "user-1",
  assignedReviewerAt: 1,
  createdAt: 1,
  updatedAt: 1,
};

describe("assignment role changes", () => {
  test("leaving review preserves the chapter admin assignment", () => {
    const assignment = { ...reviewAssignment, assignedAdminAt: 1 };
    const remainingRoles = assignmentRoles(assignment).filter((role) => role !== "reviewer");

    expect(remainingRoles).toEqual(["admin"]);
    expect(roleMask(remainingRoles)).toBe(128);
  });

  test("leaving review preserves admin and every other worker role", () => {
    const assignment = {
      ...reviewAssignment,
      assignedAdminAt: 1,
      assignedTranslatorAt: 1,
      assignedPublisherAt: 1,
    };
    const remainingRoles = assignmentRoles(assignment).filter((role) => role !== "reviewer");

    expect(remainingRoles).toEqual(["translator", "publisher", "admin"]);
    expect(roleMask(remainingRoles)).toBe(194);
  });

  test("leaving the last worker role of an ordinary assignee permits deletion", () => {
    const remainingRoles = assignmentRoles(reviewAssignment).filter((role) => role !== "reviewer");

    expect(remainingRoles).toEqual([]);
  });

  test("assigning another worker role preserves existing admin", () => {
    const assignment = { ...reviewAssignment, assignedAdminAt: 1 };
    const roles = assignmentRoles(assignment);

    expect(roleMask([...roles, "translator"])).toBe(162);
  });
});
