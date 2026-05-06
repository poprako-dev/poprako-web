import { api } from "./util";
import type { Result } from "@/types/utils/result";
import type { AssignmentInfo } from "@/types/assignment";
import {
  unwrapRawAssignmentInfo,
  type RawAssignmentInfo,
} from "@/types/raw/assignment";

type ListAssignmentsByChapterArgs = {
  chapterId: string;
  offset: number;
  limit: number;
  includes?: string[];
};

type ListMyAssignmentsArgs = {
  offset: number;
  limit: number;
  includes?: string[];
};

type UpsertAssignmentArgs = {
  chapterId: string;
  userId: string;
  roleMask: number;
};

export async function listAssignmentsByChapter(
  args: ListAssignmentsByChapterArgs,
): Promise<Result<AssignmentInfo[]>> {
  const result = await api.get<RawAssignmentInfo[]>("/assignments", {
    chapter_id: args.chapterId,
    offset: args.offset,
    limit: args.limit,
    includes: args.includes,
  });
  if (!result.success) return result;

  return {
    success: true,
    data: (result.data ?? []).map(unwrapRawAssignmentInfo),
  };
}

export async function listMyAssignments(
  args: ListMyAssignmentsArgs,
): Promise<Result<AssignmentInfo[]>> {
  const result = await api.get<RawAssignmentInfo[]>("/assignments/mine", {
    includes: args.includes,
    offset: args.offset,
    limit: args.limit,
  });
  if (!result.success) return result;

  return {
    success: true,
    data: (result.data ?? []).map(unwrapRawAssignmentInfo),
  };
}

export async function upsertAssignment(
  args: UpsertAssignmentArgs,
): Promise<Result<{ id: string }>> {
  return api.put<{ id: string }, { chapter_id: string; user_id: string; role_mask: number }>(
    "/assignments",
    {
      chapter_id: args.chapterId,
      user_id: args.userId,
      role_mask: args.roleMask,
    },
  );
}

export async function deleteAssignment(
  assignmentId: string,
): Promise<Result<void>> {
  const result = await api.delete<void>(`/assignments/${assignmentId}`);
  if (!result.success) return result;

  return { success: true, data: undefined };
}
