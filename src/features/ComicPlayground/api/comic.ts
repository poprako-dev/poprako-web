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
  const rawArgs: Omit<RawListComicArgs, "workset_id"> = {
    includes: args.includes,
    offset: args.offset,
    limit: args.limit,
  };

  const res = await api.get<RawComicInfo[]>(
    `/comics/worksets/${args.worksetId}`,
    rawArgs,
  );
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
