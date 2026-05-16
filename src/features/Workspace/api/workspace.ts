import { listAssignmentsByChapter, listMyAssignments } from "@/api/assignment";
import { listChapters } from "@/features/ComicPlayground/api/chapter";
import type { ComicInfo, ChapterInfo } from "@/types";
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

export async function fetchLatestChapter(
  comicInfo: ComicInfo,
): Promise<Result<ChapterInfo | null>> {
  const result = await listChapters({
    comicId: comicInfo.id,
    offset: 0,
    limit: 20,
  });
  if (!result.success) return result;
  const pinned = result.data.find((c) => c.isPinned) ?? result.data[0] ?? null;
  return { success: true, data: pinned };
}

export async function fetchComicAssignments(
  comicInfo: ComicInfo,
): Promise<Result<AssignmentInfo[]>> {
  const chaptersResult = await listChapters({
    comicId: comicInfo.id,
    offset: 0,
    limit: 20,
  });
  if (!chaptersResult.success) return chaptersResult;
  const chapter =
    chaptersResult.data.find((c) => c.isPinned) ?? chaptersResult.data[0];
  if (!chapter) return { success: true, data: [] };
  return listAssignmentsByChapter({
    chapterId: chapter.id,
    offset: 0,
    limit: 50,
    includes: ["user"],
  });
}
