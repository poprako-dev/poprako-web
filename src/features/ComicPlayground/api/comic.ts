import type { RawComicInfo } from "@/types/raw/comic";
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
import type { Result } from "@/types/utils/result";
import type { ComicInfo } from "@/types";

export async function listComics(
  args: ListComicArgs,
): Promise<Result<ComicInfo[]>> {
  const rawArgs: RawListComicArgs = {
    workset_id: args.worksetId,
    includes: args.includes,
    fuzzy_title: args.fuzzyTitle,
    upload_phase: args.uploadPhase,
    translate_phase: args.translatePhase,
    proofread_phase: args.proofreadPhase,
    typeset_phase: args.typesetPhase,
    review_phase: args.reviewPhase,
    publish_phase: args.publishPhase,
    offset: args.offset,
    limit: args.limit,
  };

  const res = await api.get<RawComicInfo[]>("/comics", rawArgs);
  if (!res.success) return res;

  const items = Array.isArray(res.data) ? res.data : [];
  return { success: true, data: items.map((raw) => toComicInfo(raw)!) };
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
    first_chapter_title: args.firstChapterTitle,
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

export async function reserveCoverUpload(
  comicId: string,
  fileExtension: string,
): Promise<Result<{ putUrl: string }>> {
  const res = await api.post<
    { put_url: string },
    { file_extension: string }
  >(`/comics/${comicId}/cover/reserve`, { file_extension: fileExtension });
  if (!res.success) return res;
  return { success: true, data: { putUrl: res.data.put_url } };
}

export async function markCoverUploaded(
  comicId: string,
): Promise<Result<void>> {
  const res = await api.post<void, Record<string, never>>(
    `/comics/${comicId}/cover/uploaded`,
    {},
  );
  if (!res.success) return res;
  return { success: true, data: undefined };
}
