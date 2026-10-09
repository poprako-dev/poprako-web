import { decodeIssueImport } from "@/api/issue/issue-contract";
import { toCamelCase } from "@/shared/utility/case-convert";
import { publishWorkflowStatus } from "@/route/_authenticated/business/chapter/chapter";
import type { ChapterInfo } from "@/route/_authenticated/business/chapter/chapter";
import type { AssignmentInfo } from "@/route/_authenticated/business/assignment/assignment";
import { hasRole } from "@/route/business/identity/role";
import type { ChapterIssuesInput } from "./issue";

export function canImportIssues(
  chapter: ChapterInfo,
  assignment: AssignmentInfo | undefined,
): boolean {
  if (!assignment) return false;
  return (
    assignment.chapterId === chapter.id &&
    hasRole(assignment, "reviewer") &&
    publishWorkflowStatus(chapter) !== "completed"
  );
}

export function parseIssueImport(text: string, pageCount: number): ChapterIssuesInput {
  const value: unknown = JSON.parse(text);
  const input = decodeIssueImport(toCamelCase(value));
  if (input.pages.length !== pageCount)
    throw new Error(
      `文件包含 ${String(input.pages.length)} 页，当前章节有 ${String(pageCount)} 页；请包含全部页面及空页`,
    );
  return input;
}
