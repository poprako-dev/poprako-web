import { api } from "@/routes/business/request";
import type { Result } from "@/shared/utility/result";
import {
  type RawTermbaseInfo,
  unwrapRawTermbaseInfo,
} from "@/routes/_authenticated/translator/business/terminology/raw-termbase";
import type { TermbaseInfo } from "@/routes/_authenticated/translator/business/terminology/termbase";
import type {
  CreateComicTermbaseArgs,
  ListComicTermbasesArgs,
  RawCreateComicTermbaseArgs,
  RawListComicTermbasesArgs,
  RawUpdateTermbaseArgs,
  UpdateTermbaseArgs,
} from "@/routes/_authenticated/translator/business/terminology/termbase-input";

export async function listComicTermbases(
  args: ListComicTermbasesArgs,
): Promise<Result<TermbaseInfo[]>> {
  const rawArgs: Omit<RawListComicTermbasesArgs, "comic_id"> = {
    fuzzy_name: args.fuzzyName,
    offset: args.offset,
    limit: args.limit,
  };

  const result = await api.get<RawTermbaseInfo[]>(`/comics/${args.comicId}/termbases`, rawArgs);
  if (!result.success) return result;

  return {
    success: true,
    data: result.data.map((item) => unwrapRawTermbaseInfo(item)),
  };
}

export async function getTermbase(id: string): Promise<Result<TermbaseInfo>> {
  const result = await api.get<RawTermbaseInfo>(`/termbases/${id}`);
  if (!result.success) return result;

  return {
    success: true,
    data: unwrapRawTermbaseInfo(result.data),
  };
}

export async function createComicTermbase(args: CreateComicTermbaseArgs): Promise<Result<string>> {
  const rawArgs: RawCreateComicTermbaseArgs = {
    comic_id: args.comicId,
    name: args.name,
    description: args.description,
  };

  const result = await api.post<{ id: string }, RawCreateComicTermbaseArgs>("/termbases", rawArgs);
  if (!result.success) return result;

  return { success: true, data: result.data.id };
}

export async function updateTermbase(
  id: string,
  args: UpdateTermbaseArgs,
): Promise<Result<undefined>> {
  const rawArgs: RawUpdateTermbaseArgs = {
    id,
    name: args.name,
    description: args.description,
  };

  return api.put<undefined, RawUpdateTermbaseArgs>(`/termbases/${id}`, rawArgs);
}

export async function deleteTermbase(id: string): Promise<Result<undefined>> {
  return api.delete<undefined>(`/termbases/${id}`);
}
