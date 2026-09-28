import type {
  RawComicInfo,
  RawListComicInfosPayload,
} from "@/routes/_authenticated/business/comic/raw-comic";
import type {
  ComicInclude,
  CreateComicArgs,
  ListComicArgs,
  RawCreateComicArgs,
  RawListComicArgs,
  RawUpdateComicArgs,
  UpdateComicArgs,
} from "@/routes/_authenticated/business/comic/comic-input";
import { api } from "@/routes/business/request";
import { unwrapRawComicInfo } from "@/routes/_authenticated/business/comic/raw-comic";
import type { ComicInfo } from "@/routes/_authenticated/business/comic/comic";
import { toChapterInfo } from "@/routes/_authenticated/business/chapter/chapter";
import type { Result } from "@/shared/utility/result";
import type { AllocImageArgs, ImageUploadSlot } from "@/routes/business/identity/image";
import { unwrapRawAssignmentInfo } from "@/routes/_authenticated/business/assignment/raw-assignment";

export async function listComics(args: ListComicArgs): Promise<Result<ComicInfo[]>> {
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
  if (!res.success) return res;

  const payload = res.data;
  const comics = payload.comics;
  const pinnedChapters = payload.pinned_chapters;
  const pinnedChapterAssignmentsList = payload.pinned_chapter_assignments;

  return {
    success: true,
    data: comics.flatMap((raw, i) => {
      const comic = unwrapRawComicInfo(raw);
      const pinnedChapter = pinnedChapters.at(i);
      return [
        {
          ...comic,
          pinnedChapter: pinnedChapter ? toChapterInfo(pinnedChapter) : undefined,
          pinnedChapterAssignments: (pinnedChapterAssignmentsList.at(i) ?? []).map((item) =>
            unwrapRawAssignmentInfo(item),
          ),
        },
      ];
    }),
  };
}

export async function getComic(
  id: string,
  includes: ComicInclude[] = [],
): Promise<Result<ComicInfo>> {
  const res = await api.get<RawComicInfo>(`/comics/${id}`, { incl: includes });
  if (!res.success) return res;

  const comic = unwrapRawComicInfo(res.data);

  return { success: true, data: comic };
}

export async function createComic(args: CreateComicArgs): Promise<Result<string>> {
  const rawArgs: RawCreateComicArgs = {
    workset_id: args.worksetId,
    title: args.title,
    author: args.author,
    description: args.description,
    first_chapter_subtitle: args.firstChapterTitle,
    preset_assignment_roles: args.presetAssignmentRoles,
  };

  const res = await api.post<{ id: string }, RawCreateComicArgs>("/comics", rawArgs);
  if (!res.success) return res;
  return { success: true, data: res.data.id };
}

export async function updateComic(id: string, args: UpdateComicArgs): Promise<Result<undefined>> {
  const rawArgs: RawUpdateComicArgs = {
    id,
    title: args.title,
    author: args.author,
    description: args.description,
  };

  const res = await api.put<undefined, RawUpdateComicArgs>(`/comics/${id}`, rawArgs);
  if (!res.success) return res;
  return { success: true, data: undefined };
}

export async function deleteComic(id: string): Promise<Result<undefined>> {
  const res = await api.delete<undefined>(`/comics/${id}`);
  if (!res.success) return res;
  return { success: true, data: undefined };
}

export async function archiveComic(id: string): Promise<Result<undefined>> {
  const res = await api.post<{ archived_comic_id: string }, Record<string, never>>(
    `/comics/${id}/archive`,
    {},
  );
  if (!res.success) return res;
  return { success: true, data: undefined };
}

export async function allocCoverUpload(
  comicId: string,
  args: AllocImageArgs,
): Promise<Result<ImageUploadSlot | null>> {
  const res = await api.post<
    {
      slot: {
        put_url: string;
        image_version: number;
        headers: Record<string, string>;
      } | null;
    },
    { image_hash: string; new_byte_len: number; ext: string }
  >(`/comics/${comicId}/cover/alloc`, {
    image_hash: args.imageHash,
    new_byte_len: args.newByteLen,
    ext: args.extension,
  });
  if (!res.success) return res;
  return {
    success: true,
    data:
      res.data.slot === null
        ? null
        : {
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
  if (!res.success) return res;
  return { success: true, data: undefined };
}
