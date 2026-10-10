import { decodeIssueImport, decodeIssueInput } from "@/api/issue/issue-contract";
import type { IssueInput } from "@/api/issue/issue-contract";
import { decodeArray, decodeObject } from "@/api/contract";
import { naturalArtworkPages } from "@/route/_authenticated/business/artwork/artwork";
import type { PageArtwork } from "@/route/_authenticated/business/artwork/artwork";
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

export type IssueFile = { pages: { pageArtworkId?: string; issues: IssueInput[] }[] };
export function parseIssueImport(text: string): IssueFile {
  const value: unknown = JSON.parse(text);
  const object = decodeObject(toCamelCase(value));
  const pages = decodeArray(object["pages"], (value) => decodeObject(value));
  if (pages.some((page) => page["pageArtworkId"] !== undefined)) return decodeIssueImport(object);
  return {
    pages: pages.map((page) => ({ issues: decodeArray(page["issues"], decodeIssueInput) })),
  };
}

export function resolveIssueImport(
  file: IssueFile,
  pages: readonly PageArtwork[],
): ChapterIssuesInput {
  const explicit = file.pages.every((page) => page.pageArtworkId !== undefined);
  const ordered = explicit ? [] : naturalArtworkPages(pages);
  if (!explicit && file.pages.length !== ordered.length) {
    throw new Error(
      `监稿文件包含 ${String(file.pages.length)} 页，当前成稿有 ${String(ordered.length)} 页，请选择与当前成稿对应的监稿文件。`,
    );
  }
  const ids = new Set<string>();
  return {
    pages: file.pages.map((page, index) => {
      const pageArtworkId = page.pageArtworkId ?? ordered[index]?.id;
      if (
        !pageArtworkId ||
        ids.has(pageArtworkId) ||
        !pages.some((item) => item.id === pageArtworkId)
      ) {
        throw new Error("监稿包含重复或不属于当前章节的成稿页面。");
      }
      ids.add(pageArtworkId);
      return { pageArtworkId, issues: page.issues };
    }),
  };
}
