import { expect, test } from "vitest";
import { removeDetailAssignment, loadDetailAssignments } from "../use-detail-actions";
import { createDetailStoryApi, mutationLog } from "./detail-story-api";

test("combined role removal accepts the real PUT 204 contract before DELETE", async () => {
  mutationLog.length = 0;
  const client = createDetailStoryApi("combined");
  expect(await removeDetailAssignment(client, "chapter-42", "u-dual", "typesetter")).toEqual({
    success: true,
    data: undefined,
  });
  expect(await removeDetailAssignment(client, "chapter-42", "u-dual", "redrawer")).toEqual({
    success: true,
    data: undefined,
  });
  expect(mutationLog.map(({ method }) => method)).toEqual(["PUT", "DELETE"]);
  const remaining = await loadDetailAssignments(client, "chapter-42");
  expect(remaining.success).toBe(true);
  if (remaining.success)
    expect(remaining.data.some(({ userId }) => userId === "u-dual")).toBe(false);
});
