import { listAssignmentsByChapter, listMyAssignments } from "@/api/assignment";
import type { ComicInfo } from "@/types";
import type { AssignmentInfo } from "@/types/assignment";
import type { Result } from "@/types/utils/result";
import type { ComicTranslationListItem } from "@/features/ComcList/types/types";

export async function fetchMyAssignmentComicCards(
  offset: number,
  limit: number,
): Promise<ComicTranslationListItem[] | string> {
  const result = await listMyAssignments({
    includes: ["chapter.comic.workset.team"],
    offset,
    limit,
  });
  if (!result.success) return result.error;
  const cards: ComicTranslationListItem[] = [];
  for (const assignment of result.data) {
    const chapter = assignment.chapter;
    const comicInfo = chapter?.comic;
    if (comicInfo && chapter) {
      cards.push({ comicInfo, chapter });
    }
  }
  return cards;
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
