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
    fuzzy_title: args.fuzzyTitle,
    upload_status: args.uploadStatus,
    translate_status: args.translateStatus,
    proofread_status: args.proofreadStatus,
    typeset_status: args.typesetStatus,
    review_status: args.reviewStatus,
    publish_status: args.publishStatus,
    includes: args.includes,
    offset: args.offset,
    limit: args.limit,
  };

  const res = await api.get<RawComicInfo[]>("/comics", rawArgs);
  if (!res.success) return res;

  const items = Array.isArray(res.data) ? res.data : [];
  return { success: true, data: items.map((raw) => toComicInfo(raw)!) };
}

export async function createComic(
  args: CreateComicArgs,
): Promise<Result<string>> {
  const rawArgs: RawCreateComicArgs = {
    workset_id: args.worksetId,
    title: args.title,
    author: args.author,
    description: args.description,
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
