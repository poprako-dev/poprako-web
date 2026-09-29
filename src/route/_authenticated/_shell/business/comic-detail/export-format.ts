import { hasRole } from "@/route/business/identity/role";
import type { AssignmentInfo } from "@/route/_authenticated/business/assignment/assignment";
import { sanitizeExportFileName } from "@/route/_authenticated/_shell/business/comic-detail/export-download-utils";

type ExportNameArgs = {
  comicIndex: number | null | undefined;
  chapterIndex: number | undefined;
  author: string | null | undefined;
  title: string;
  subtitle: string | undefined;
};

export function buildComicDetailExportName(args: ExportNameArgs): string {
  const normalizedComicIndex = (args.comicIndex ?? 0) + 1;
  const chapterIndex = (args.chapterIndex ?? 0) + 1;
  const author = args.author ?? "未知作者";
  return sanitizeExportFileName(
    `【#${String(normalizedComicIndex)}-${String(chapterIndex)}】` +
      `[${author}]${args.title}（${args.subtitle ?? ""}）`,
  );
}

export function buildAssignmentExportText(assignments: AssignmentInfo[]): string {
  const pickNames = (isMatch: (assignment: AssignmentInfo) => boolean): string =>
    [
      ...new Set(
        assignments
          .filter(isMatch)
          .map((assignment) => assignment.user?.name ?? assignment.userId)
          .filter(Boolean),
      ),
    ].join("、");

  return [
    `【图源】${pickNames((item) => hasRole(item, "rawProvider"))}`,
    `【翻译】${pickNames((item) => hasRole(item, "translator"))}`,
    `【校对】${pickNames((item) => hasRole(item, "proofreader"))}`,
    `【嵌字】${pickNames((item) => hasRole(item, "typesetter") || hasRole(item, "redrawer"))}`,
    `【监修】${pickNames((item) => hasRole(item, "reviewer"))}`,
    `【上传】${pickNames((item) => hasRole(item, "publisher"))}`,
  ].join("\n");
}
