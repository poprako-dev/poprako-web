import type { ApiClient } from "@/api/client";
import { listPageIssues, importChapterIssues } from "@/api/issue/issue-api";
import { toApiRequestError } from "@/route/business/request-error";
import type { IssueInfo, ChapterIssuesInput } from "./issue";
import { listPages } from "@/route/_authenticated/business/page/page-request";
import { listAssignments } from "@/api/assignment/assignment-api";
import type { AssignmentInfo } from "@/route/_authenticated/business/assignment/assignment";
import { toAssignmentInfo } from "@/route/_authenticated/business/content-adapter";
import type { Result } from "@/shared/utility/result";

export async function getIssueAssignment(
  client: ApiClient,
  chapterId: string,
  userId: string,
): Promise<Result<AssignmentInfo | undefined>> {
  const result = await listAssignments(client, { chapterId, ownerId: userId, offset: 0, limit: 1 });
  return result.success
    ? {
        success: true,
        data: result.data
          .map(toAssignmentInfo)
          .find((assignment) => assignment.chapterId === chapterId && assignment.userId === userId),
      }
    : result;
}

export async function loadPageIssues(
  client: ApiClient,
  pageId: string,
  signal: AbortSignal,
): Promise<IssueInfo[]> {
  const result = await listPageIssues(client, pageId, signal);
  signal.throwIfAborted();
  if (!result.success) throw toApiRequestError(result);
  if (result.data.some((issue) => issue.pageId !== pageId)) throw new Error("issue 不属于当前页面");
  return result.data.sort((a, b) => a.index - b.index);
}

export async function replaceChapterIssues(
  client: ApiClient,
  chapterId: string,
  input: ChapterIssuesInput,
  pageIds: readonly string[],
  signal: AbortSignal,
): Promise<void> {
  const manifest = await listPages(client, { chapterId });
  signal.throwIfAborted();
  if (!manifest.success) throw toApiRequestError(manifest);
  const currentIds = manifest.data.sort((a, b) => a.index - b.index).map((page) => page.id);
  if (
    input.pages.length !== pageIds.length ||
    currentIds.length !== pageIds.length ||
    currentIds.some((id, index) => id !== pageIds[index])
  ) {
    throw new Error("章节页面或顺序已变化，请刷新工作台后重新导入");
  }
  const result = await importChapterIssues(client, chapterId, input, signal);
  signal.throwIfAborted();
  if (!result.success) throw toApiRequestError(result);
}
