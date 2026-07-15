import { listAssignmentsByChapter, listMyAssignments } from "@/api/assignment";
import type { ComicInfo } from "@/types";
import type { AssignmentInfo } from "@/types/assignment";
import type { Result } from "@/types/utils/result";

export async function fetchMyComics(
  offset: number,
  limit: number,
): Promise<ComicInfo[] | string> {
  const result = await listMyAssignments({
    includes: ["chapter.comic.workset.team"],
    offset,
    limit,
  });
  if (!result.success) return result.error;
  const seen = new Set<string>();
  const comics: ComicInfo[] = [];
  for (const assignment of result.data) {
    const comic = assignment.chapter?.comic;
    if (comic && !seen.has(comic.id)) {
      seen.add(comic.id);
      comics.push(comic);
    }
  }
  return comics;
}

export async function fetchComicAssignments(
  comicInfo: ComicInfo,
): Promise<Result<AssignmentInfo[]>> {
  const chapterId = comicInfo.pinnedChapter?.id;
  if (!chapterId) return { success: true, data: [] };
  return listAssignmentsByChapter({
    chapterId,
    offset: 0,
    limit: 50,
    includes: ["user"],
  });
}
