import { api } from "@/api/util";
import { unwrapRawTermInfo, type RawTermInfo } from "@/types/raw/term";
import type { TermInfo } from "@/types/term";
import type { Result } from "@/types/utils/result";
import type {
  CreateTermArgs,
  ListTermsArgs,
  RawCreateTermArgs,
  RawListTermsArgs,
  RawUpdateTermArgs,
  UpdateTermArgs,
} from "../types/term";

export async function listTerms(
  args: ListTermsArgs,
): Promise<Result<TermInfo[]>> {
  const rawArgs: Omit<RawListTermsArgs, "termbase_id"> = {
    fuzzy_source: args.fuzzySource,
    offset: args.offset,
    limit: args.limit,
  };

  const result = await api.get<RawTermInfo[]>(
    `/termbases/${args.termbaseId}/terms`,
    rawArgs,
  );
  if (!result.success) return result;

  return {
    success: true,
    data: result.data.map(unwrapRawTermInfo),
  };
}

export async function getTerm(id: string): Promise<Result<TermInfo>> {
  const result = await api.get<RawTermInfo>(`/terms/${id}`);
  if (!result.success) return result;

  return {
    success: true,
    data: unwrapRawTermInfo(result.data),
  };
}

export async function createTerm(args: CreateTermArgs): Promise<Result<string>> {
  const rawArgs: RawCreateTermArgs = {
    termbase_id: args.termbaseId,
    source: args.source,
    targets: args.targets,
    comment: args.comment,
  };

  const result = await api.post<{ id: string }, RawCreateTermArgs>(
    "/terms",
    rawArgs,
  );
  if (!result.success) return result;

  return { success: true, data: result.data.id };
}

export async function updateTerm(
  id: string,
  args: UpdateTermArgs,
): Promise<Result<void>> {
  const rawArgs: RawUpdateTermArgs = {
    id,
    source: args.source,
    targets: args.targets,
    comment: args.comment,
  };

  return api.put<void, RawUpdateTermArgs>(`/terms/${id}`, rawArgs);
}

export async function deleteTerm(id: string): Promise<Result<void>> {
  return api.delete<void>(`/terms/${id}`);
}
