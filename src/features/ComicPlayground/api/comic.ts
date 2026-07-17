import type { RawComicInfo, RawListComicInfosPayload } from "@/types/raw/comic";
import type {
  ListComicArgs,
  RawListComicArgs,
  CreateComicArgs,
  RawCreateComicArgs,
  UpdateComicArgs,
  RawUpdateComicArgs,
} from "../types/comic";
import { api } from "@/api/util";
import { toComicInfo } from "@/types";
import type { ComicInfo } from "@/types";
import { toChapterInfo } from "@/types/chapter";
import type { Result } from "@/types/utils/result";

export async function listComics(
  args: ListComicArgs,
): Promise<Result<ComicInfo[]>> {
  const rawArgs: Omit<RawListComicArgs, "workset_id"> = {
    incl: args.includes,
    with: args.withs,
    fuzzy_title: args.fuzzyTitle,
    stages: undefined,
    offset: args.offset,
    limit: args.limit,
  };

  const res = await api.get<RawListComicInfosPayload>(
    `/worksets/${args.worksetId}/comics`,
    rawArgs,
  );
  if (!res.success) return res;

  const payload = res.data;
  const comics = Array.isArray(payload.comics) ? payload.comics : [];
  const pinnedChapters = Array.isArray(payload.pinned_chapters)
    ? payload.pinned_chapters
    : [];

  return {
    success: true,
    data: comics.map((raw, i) => ({
      ...toComicInfo(raw)!,
      pinnedChapter: pinnedChapters[i]
        ? toChapterInfo(pinnedChapters[i]!)
        : undefined,
    })),
  };
}

export async function getComic(id: string): Promise<Result<ComicInfo>> {
  const res = await api.get<RawComicInfo>(`/comics/${id}`);
  if (!res.success) return res;

  const comic = toComicInfo(res.data);
  if (!comic) {
    return { success: false, error: "漫画不存在" };
  }

  return { success: true, data: comic };
}

export async function createComic(
  args: CreateComicArgs,
): Promise<Result<string>> {
  const rawArgs: RawCreateComicArgs = {
    workset_id: args.worksetId,
    title: args.title,
    author: args.author,
    description: args.description,
    first_chapter_subtitle: args.firstChapterTitle,
    preset_assignment_roles: args.presetAssignmentRoles,
  };

  const res = await api.post<{ id: string }, RawCreateComicArgs>(
    "/comics",
    rawArgs,
  );
  if (!res.success) return res;
  return { success: true, data: (res.data as { id: string }).id };
}

export async function updateComic(
  id: string,
  args: UpdateComicArgs,
): Promise<Result<void>> {
  const rawArgs: RawUpdateComicArgs = {
    id,
    title: args.title,
    author: args.author,
    description: args.description,
  };

  const res = await api.put<void, RawUpdateComicArgs>(`/comics/${id}`, rawArgs);
  if (!res.success) return res;
  return { success: true, data: undefined };
}

export async function deleteComic(id: string): Promise<Result<void>> {
  const res = await api.delete<void>(`/comics/${id}`);
  if (!res.success) return res;
  return { success: true, data: undefined };
}

export async function archiveComic(id: string): Promise<Result<void>> {
  const res = await api.post<{ archived_comic_id: string }, Record<string, never>>(
    `/comics/${id}/archive`,
    {},
  );
  if (!res.success) return res;
  return { success: true, data: undefined };
}

export async function reserveCoverUpload(
  comicId: string,
  fileExtension: string,
): Promise<Result<{ putUrl: string; coverVersion: number }>> {
  const res = await api.post<
    { put_url: string; cover_version: number },
    { file_ext: string }
  >(`/comics/${comicId}/cover/reserve`, { file_ext: fileExtension });
  if (!res.success) return res;
  return {
    success: true,
    data: {
      putUrl: res.data.put_url,
      coverVersion: res.data.cover_version,
    },
  };
}

export async function markCoverUploaded(
  comicId: string,
  coverVersion: number,
): Promise<Result<void>> {
  const res = await api.post<void, { cover_version: number }>(
    `/comics/${comicId}/cover/mark-uploaded`,
    { cover_version: coverVersion },
  );
  if (!res.success) return res;
  return { success: true, data: undefined };
}
