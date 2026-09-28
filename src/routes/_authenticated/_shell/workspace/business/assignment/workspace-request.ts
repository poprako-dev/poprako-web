import {
  listAssignmentsByChapter,
  listMyAssignments,
} from "@/routes/_authenticated/business/assignment/assignment-request";
import type { ComicInfo } from "@/routes/_authenticated/business/comic/comic";
import type { AssignmentInfo } from "@/routes/_authenticated/business/assignment/assignment";
import type { Result } from "@/shared/utility/result";
import type { ComicTranslationListItem } from "@/routes/_authenticated/_shell/business/comic-list/comic-list";

export async function fetchMyAssignmentComicCards(
  offset: number,
  limit: number,
): Promise<Result<ComicTranslationListItem[]>> {
  const result = await listMyAssignments({
    includes: ["chapter.comic.workset.team"],
    offset,
    limit,
  });
  if (!result.success) return result;
  const cards: ComicTranslationListItem[] = [];
  for (const assignment of result.data) {
    const chapter = assignment.chapter;
    const comicInfo = chapter?.comic;
    if (comicInfo) {
      cards.push({ comicInfo, chapter });
    }
  }
  return { success: true, data: cards };
}

export async function fetchComicAssignments(
  comicInfo: ComicInfo,
): Promise<Result<AssignmentInfo[]>> {
  const chapterId = comicInfo.pinnedChapter?.id;
  if (!chapterId) return { success: true, data: [] };
  return listAssignmentsByChapter({
    chapterId,
    offset: 0,
    limit: 20,
    includes: ["user"],
  });
}
