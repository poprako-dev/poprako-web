import type { ApiClient } from "@/api/client";
import { listChapterIssues, importChapterIssues } from "@/api/issue/issue-api";
import { toApiRequestError } from "@/route/business/request-error";
import type { IssueInfo, ChapterIssuesInput } from "./issue";
import { listAssignmentsByChapter } from "@/route/_authenticated/business/assignment/assignment-request";
import type { AssignmentInfo } from "@/route/_authenticated/business/assignment/assignment";
import type { Result } from "@/shared/utility/result";

const ASSIGNMENT_PAGE_SIZE = 100;

export async function getIssueAssignment(
  client: ApiClient,
  chapterId: string,
  userId: string,
): Promise<Result<AssignmentInfo | undefined>> {
  for (let offset = 0; ; offset += ASSIGNMENT_PAGE_SIZE) {
    const result = await listAssignmentsByChapter(client, {
      chapterId,
      offset,
      limit: ASSIGNMENT_PAGE_SIZE,
    });
    if (!result.success) return result;
    const assignment = result.data.find(
      (assignment) => assignment.chapterId === chapterId && assignment.userId === userId,
    );
    if (assignment) return { success: true, data: assignment };
    if (result.data.length < ASSIGNMENT_PAGE_SIZE) return { success: true, data: undefined };
  }
}

export async function loadChapterIssues(
  client: ApiClient,
  chapterId: string,
  signal: AbortSignal,
): Promise<IssueInfo[]> {
  const result = await listChapterIssues(client, chapterId, signal);
  signal.throwIfAborted();
  if (!result.success) throw toApiRequestError(result);
  return result.data;
}

export async function replaceChapterIssues(
  client: ApiClient,
  chapterId: string,
  input: ChapterIssuesInput,
  signal: AbortSignal,
): Promise<void> {
  const result = await importChapterIssues(client, chapterId, input, signal);
  signal.throwIfAborted();
  if (!result.success) throw toApiRequestError(result);
}
