import type { ApiClient } from "@/api/client";
import {
  listAssignmentsByChapter,
  listMyAssignments,
} from "@/route/_authenticated/business/assignment/assignment-request";
import type { ComicInfo } from "@/route/_authenticated/business/comic/comic";
import type { AssignmentInfo } from "@/route/_authenticated/business/assignment/assignment";
import type { Result } from "@/shared/utility/result";
import type { ComicTranslationListItem } from "@/route/_authenticated/_shell/business/comic-list/comic-list";

export async function fetchMyAssignmentComicCards(
  client: ApiClient,
  userId: string,
  offset: number,
  limit: number,
): Promise<Result<ComicTranslationListItem[]>> {
  const result = await listMyAssignments(client, {
    userId,
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
  client: ApiClient,
  comicInfo: ComicInfo,
): Promise<Result<AssignmentInfo[]>> {
  const chapterId = comicInfo.pinnedChapter?.id;
  if (!chapterId) return { success: true, data: [] };
  return listAssignmentsByChapter(client, {
    chapterId,
    offset: 0,
    limit: 20,
    includes: ["user"],
  });
}
