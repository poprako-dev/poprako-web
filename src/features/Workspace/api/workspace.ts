import { api } from "@/api/util";
import { listChapters } from "@/features/ComicPlayground/api/chapter";
import type { ComicInfo, ChapterInfo } from "@/types";
import type { AssignmentInfo } from "@/types/assignment";
import type { UserStatsInfo } from "@/types/userStats";
import type { Result } from "@/types/utils/result";
import {
  unwrapRawAssignmentInfo,
  type RawAssignmentInfo,
} from "@/types/raw/assignment";

export async function fetchMyStats(): Promise<UserStatsInfo | string> {
  const result = await api.get<UserStatsInfo>(
    "/users/mine/stats",
    undefined,
    true,
  );
  if (!result.success) return result.error;
  return result.data;
}

export async function fetchMyComics(
  offset: number,
  limit: number,
): Promise<ComicInfo[] | string> {
  const result = await api.get<RawAssignmentInfo[]>(
    "/assignments/mine",
    { includes: ["chapter.comic"], offset, limit },
    true,
  );
  if (!result.success) return result.error;
  const seen = new Set<string>();
  const comics: ComicInfo[] = [];
  for (const raw of result.data) {
    const assignment = unwrapRawAssignmentInfo(raw);
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
  const result = await api.get<RawAssignmentInfo[]>(
    "/assignments",
    { chapter_id: chapter.id, offset: 0, limit: 50 },
    true,
  );
  if (!result.success) return result;
  return { success: true, data: result.data.map(unwrapRawAssignmentInfo) };
}
