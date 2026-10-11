import type { PageArtwork } from "@/api/page-artwork/page-artwork-api";
import type { ChapterInfo } from "@/route/_authenticated/business/chapter/chapter";
import { publishWorkflowStatus } from "@/route/_authenticated/business/chapter/chapter";
import type { AssignmentInfo } from "@/route/_authenticated/business/assignment/assignment";
import { hasRole } from "@/route/business/identity/role";
export type { PageArtwork } from "@/api/page-artwork/page-artwork-api";

const order = new Intl.Collator("zh-CN", { numeric: true, sensitivity: "base" });
export function compareArtworkNames(left: string, right: string): number {
  return order.compare(left, right) || left.localeCompare(right, "zh-CN");
}
export function naturalArtworkPages(pages: readonly PageArtwork[]): PageArtwork[] {
  if (pages.some((page) => !page.rawIdent?.trim()))
    throw new Error("成稿页面缺少文件名，无法确定监稿页序，请先重传对应成稿。");
  return [...pages].sort(
    (a, b) =>
      compareArtworkNames(a.rawIdent ?? "", b.rawIdent ?? "") ||
      a.index - b.index ||
      a.id.localeCompare(b.id),
  );
}
export function artworkPermissions(
  chapter: ChapterInfo | undefined,
  assignment: AssignmentInfo | undefined,
  isTeamAdmin: boolean,
): { images: boolean; archive: boolean } {
  if (!chapter || publishWorkflowStatus(chapter) === "completed")
    return { images: false, archive: false };
  const assigned = assignment?.chapterId === chapter.id ? assignment : undefined;
  const archive =
    isTeamAdmin ||
    Boolean(assigned && (hasRole(assigned, "typesetter") || hasRole(assigned, "redrawer")));
  return { archive, images: archive || Boolean(assigned && hasRole(assigned, "reviewer")) };
}
