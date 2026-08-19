import { api } from "@/api/util";
import type { Result } from "@/types/utils/result";
import {
  unwrapRawTermbaseInfo,
  type RawTermbaseInfo,
} from "@/types/raw/termbase";
import type { TermbaseInfo } from "@/types/termbase";
import type {
  CreateComicTermbaseArgs,
  ListComicTermbasesArgs,
  RawCreateComicTermbaseArgs,
  RawListComicTermbasesArgs,
  RawUpdateTermbaseArgs,
  UpdateTermbaseArgs,
} from "../types/termbase";

export async function listComicTermbases(
  args: ListComicTermbasesArgs,
): Promise<Result<TermbaseInfo[]>> {
  const rawArgs: Omit<RawListComicTermbasesArgs, "comic_id"> = {
    fuzzy_name: args.fuzzyName,
    offset: args.offset,
    limit: args.limit,
  };

  const result = await api.get<RawTermbaseInfo[]>(
    `/comics/${args.comicId}/termbases`,
    rawArgs,
  );
  if (!result.success) return result;

  return {
    success: true,
    data: result.data.map(unwrapRawTermbaseInfo),
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

export async function createComicTermbase(
  args: CreateComicTermbaseArgs,
): Promise<Result<string>> {
  const rawArgs: RawCreateComicTermbaseArgs = {
    comic_id: args.comicId,
    name: args.name,
    description: args.description,
  };

  const result = await api.post<{ id: string }, RawCreateComicTermbaseArgs>(
    "/termbases",
    rawArgs,
  );
  if (!result.success) return result;

  return { success: true, data: result.data.id };
}

export async function updateTermbase(
  id: string,
  args: UpdateTermbaseArgs,
): Promise<Result<void>> {
  const rawArgs: RawUpdateTermbaseArgs = {
    id,
    name: args.name,
    description: args.description,
  };

  return api.put<void, RawUpdateTermbaseArgs>(`/termbases/${id}`, rawArgs);
}

export async function deleteTermbase(id: string): Promise<Result<void>> {
  return api.delete<void>(`/termbases/${id}`);
}
