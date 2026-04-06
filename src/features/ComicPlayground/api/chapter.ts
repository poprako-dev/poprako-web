import { api } from "@/api/util";
import { toChapterInfo } from "@/types/chapter";
import type { ChapterInfo } from "@/types/chapter";
import type { Result } from "@/types/utils/result";
import type { RawChapterInfo } from "@/types/raw/chapter";
import type {
  ListChapterArgs,
  RawListChapterArgs,
  CreateChapterArgs,
  RawCreateChapterArgs,
  UpdateChapterArgs,
  RawUpdateChapterArgs,
} from "../types/chapter";

export async function listChapters(
  args: ListChapterArgs,
): Promise<Result<ChapterInfo[]>> {
  const rawArgs: RawListChapterArgs = {
    comic_id: args.comicId,
    offset: args.offset,
    limit: args.limit,
  };

  const res = await api.get<RawChapterInfo[]>("/chapters", rawArgs);

  if (!res.success) return res;

  const items = Array.isArray(res.data) ? res.data : [];

  return { success: true, data: items.map((raw) => toChapterInfo(raw)!) };
}

export async function createChapter(
  args: CreateChapterArgs,
): Promise<Result<string>> {
  const rawArgs: RawCreateChapterArgs = {
    comic_id: args.comicId,
    subtitle: args.subtitle,
  };

  const res = await api.post<{ id: string }, RawCreateChapterArgs>(
    "/chapters",
    rawArgs,
  );
  if (!res.success) return res;
  return { success: true, data: (res.data as { id: string }).id };
}

export async function updateChapter(
  id: string,
  args: UpdateChapterArgs,
): Promise<Result<void>> {
  const rawArgs: RawUpdateChapterArgs = {
    chapter_id: id,
    subtitle: args.subtitle,
    is_pinned: args.isPinned,
    workflow_transition: args.workflowTransition,
  };

  const res = await api.patch<void, RawUpdateChapterArgs>(
    `/chapters/${id}`,
    rawArgs,
  );
  if (!res.success) return res;
  return { success: true, data: undefined };
}

export async function deleteChapter(id: string): Promise<Result<void>> {
  const res = await api.delete<void>(`/chapters/${id}`);
  if (!res.success) return res;
  return { success: true, data: undefined };
}
