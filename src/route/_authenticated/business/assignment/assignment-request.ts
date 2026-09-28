import type { ApiClient } from "@/api/client";
import * as assignmentApi from "@/api/assignment/assignment-api";
import type { Result } from "@/shared/utility/result";
import type { AssignmentInfo } from "./assignment";
import { toAssignmentInfo } from "../content-adapter";

type ListAssignmentsByChapterArgs = {
  chapterId: string;
  offset: number;
  limit: number;
  includes?: string[] | undefined;
};
type ListMyAssignmentsArgs = {
  userId: string;
  offset: number;
  limit: number;
  includes?: string[] | undefined;
};
type UpsertAssignmentArgs = { chapterId: string; userId: string; roles: number };
export async function listAssignmentsByChapter(
  client: ApiClient,
  args: ListAssignmentsByChapterArgs,
): Promise<Result<AssignmentInfo[]>> {
  const result = await assignmentApi.listAssignments(client, args);
  return result.success ? { success: true, data: result.data.map(toAssignmentInfo) } : result;
}
export async function listMyAssignments(
  client: ApiClient,
  args: ListMyAssignmentsArgs,
): Promise<Result<AssignmentInfo[]>> {
  const { userId, ...query } = args;
  const result = await assignmentApi.listAssignments(client, { ...query, ownerId: userId });
  return result.success ? { success: true, data: result.data.map(toAssignmentInfo) } : result;
}
export function upsertAssignment(
  client: ApiClient,
  args: UpsertAssignmentArgs,
): Promise<Result<{ id: string }>> {
  return assignmentApi.upsertAssignment(client, args.chapterId, args.userId, args.roles);
}
export function deleteAssignment(client: ApiClient, id: string): Promise<Result<undefined>> {
  return assignmentApi.deleteAssignment(client, id);
}
