import type { RawComicInfo, RawListComicInfosPayload } from "@/types/raw/comic";
import type {
  ComicInclude,
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
import type { ImageUploadSlot, AllocImageArgs } from "@/types/image";
import { unwrapRawAssignmentInfo } from "@/types/raw/assignment";

export async function listComics(
  args: ListComicArgs,
): Promise<Result<ComicInfo[]>> {
  const rawArgs: Omit<RawListComicArgs, "workset_id"> = {
    incl: args.includes,
    with: args.withs,
    fuzzy_title: args.fuzzyTitle,
    stages: args.stages,
    offset: args.offset,
    limit: args.limit,
  };

  const res = await api.get<RawListComicInfosPayload>(
    `/worksets/${args.worksetId}/comics`,
    rawArgs,
  );
  if (!res.success) {return res;}

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
    data: comics.flatMap((raw, i) => {
      const comic = toComicInfo(raw);
      if (!comic) {return [];}
      const pinnedChapter = pinnedChapters.at(i);
      return [{
      ...comic,
      pinnedChapter: pinnedChapter
        ? toChapterInfo(pinnedChapter)
        : undefined,
      pinnedChapterAssignments: (
        pinnedChapterAssignmentsList.at(i) ?? []
      ).map((item) => unwrapRawAssignmentInfo(item)),
    }];
    }),
  };
}

export async function getComic(
  id: string,
  includes: ComicInclude[] = [],
): Promise<Result<ComicInfo>> {
  const res = await api.get<RawComicInfo>(`/comics/${id}`, { incl: includes });
  if (!res.success) {return res;}

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
  if (!res.success) {return res;}
  return { success: true, data: (res.data).id };
}

export async function updateComic(
  id: string,
  args: UpdateComicArgs,
): Promise<Result<undefined>> {
  const rawArgs: RawUpdateComicArgs = {
    id,
    title: args.title,
    author: args.author,
    description: args.description,
  };

  const res = await api.put<undefined, RawUpdateComicArgs>(`/comics/${id}`, rawArgs);
  if (!res.success) {return res;}
  return { success: true, data: undefined };
}

export async function deleteComic(id: string): Promise<Result<undefined>> {
  const res = await api.delete<undefined>(`/comics/${id}`);
  if (!res.success) {return res;}
  return { success: true, data: undefined };
}

export async function archiveComic(id: string): Promise<Result<undefined>> {
  const res = await api.post<{ archived_comic_id: string }, Record<string, never>>(
    `/comics/${id}/archive`,
    {},
  );
  if (!res.success) {return res;}
  return { success: true, data: undefined };
}

export async function allocCoverUpload(
  comicId: string,
  args: AllocImageArgs,
): Promise<Result<ImageUploadSlot | null>> {
  const res = await api.post<
    { slot: { put_url: string; image_version: number; headers: Record<string, string> } | null },
    { image_hash: string; new_byte_len: number; ext: string }
  >(`/comics/${comicId}/cover/alloc`, {
    image_hash: args.imageHash,
    new_byte_len: args.newByteLen,
    ext: args.extension,
  });
  if (!res.success) {return res;}
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
  const res = await api.post<undefined, { image_version: number }>(
    `/comics/${comicId}/cover/mark-uploaded`,
    { image_version: imageVersion },
  );
  if (!res.success) {return res;}
  return { success: true, data: undefined };
}
