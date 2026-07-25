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
import type { ImageUploadSlot, ReserveImageArgs } from "@/types/image";
import { unwrapRawAssignmentInfo } from "@/types/raw/assignment";

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
  const pinnedChapterAssignmentsList = Array.isArray(
    payload.pinned_chapter_assignments,
  )
    ? payload.pinned_chapter_assignments
    : [];

  return {
    success: true,
    data: comics.map((raw, i) => ({
      ...toComicInfo(raw)!,
      pinnedChapter: pinnedChapters[i]
        ? toChapterInfo(pinnedChapters[i]!)
        : undefined,
      pinnedChapterAssignments: (
        pinnedChapterAssignmentsList[i] || []
      ).map(unwrapRawAssignmentInfo),
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
  args: ReserveImageArgs,
): Promise<Result<ImageUploadSlot | null>> {
  const res = await api.post<
    { slot: { put_url: string; image_version: number; headers: Record<string, string> } | null },
    { image_hash: string; new_byte_len: number; ext: string }
  >(`/comics/${comicId}/cover/reserve`, {
    image_hash: args.imageHash,
    new_byte_len: args.newByteLen,
    ext: args.extension,
  });
  if (!res.success) return res;
  return {
    success: true,
    data: res.data.slot === null ? null : {
      putUrl: res.data.slot.put_url,
      imageVersion: res.data.slot.image_version,
      headers: res.data.slot.headers,
    },
  };
}

export async function markCoverUploaded(
  comicId: string,
  imageVersion: number,
): Promise<Result<void>> {
  const res = await api.post<void, { image_version: number }>(
    `/comics/${comicId}/cover/mark-uploaded`,
    { image_version: imageVersion },
  );
  if (!res.success) return res;
  return { success: true, data: undefined };
}
