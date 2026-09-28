import { api } from "@/routes/business/request";
import {
  type RawTermInfo,
  unwrapRawTermInfo,
} from "@/routes/_authenticated/translator/business/terminology/raw-term";
import type { TermInfo } from "@/routes/_authenticated/translator/business/terminology/term";
import type { Result } from "@/shared/utility/result";
import type {
  CreateTermArgs,
  ListTermsArgs,
  RawCreateTermArgs,
  RawListTermsArgs,
  RawUpdateTermArgs,
  UpdateTermArgs,
} from "@/routes/_authenticated/translator/business/terminology/term-input";

export async function listTerms(args: ListTermsArgs): Promise<Result<TermInfo[]>> {
  const rawArgs: Omit<RawListTermsArgs, "termbase_id"> = {
    fuzzy_source: args.fuzzySource,
    offset: args.offset,
    limit: args.limit,
  };

  const result = await api.get<RawTermInfo[]>(`/termbases/${args.termbaseId}/terms`, rawArgs);
  if (!result.success) return result;

  return {
    success: true,
    data: result.data.map((item) => unwrapRawTermInfo(item)),
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

  const result = await api.post<{ id: string }, RawCreateTermArgs>("/terms", rawArgs);
  if (!result.success) return result;

  return { success: true, data: result.data.id };
}

export async function updateTerm(id: string, args: UpdateTermArgs): Promise<Result<undefined>> {
  const rawArgs: RawUpdateTermArgs = {
    id,
    source: args.source,
    targets: args.targets,
    comment: args.comment,
  };

  return api.put<undefined, RawUpdateTermArgs>(`/terms/${id}`, rawArgs);
}

export async function deleteTerm(id: string): Promise<Result<undefined>> {
  return api.delete<undefined>(`/terms/${id}`);
}
