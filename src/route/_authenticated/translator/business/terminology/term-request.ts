import type { ApiClient } from "@/api/client";
import {
  createTerm as createTermApi,
  deleteTerm as deleteTermApi,
  getTerm as getTermApi,
  listTerms as listTermsApi,
  updateTerm as updateTermApi,
  type CreateTermBody,
  type ListTermsQuery,
  type TermApiInfo,
  type UpdateTermBody,
} from "@/api/translator/term";
import type { Result } from "@/shared/utility/result";
import type { TermInfo } from "@/route/_authenticated/translator/business/terminology/term";
import type {
  CreateTermArgs,
  ListTermsArgs,
  UpdateTermArgs,
} from "@/route/_authenticated/translator/business/terminology/term-input";

function toTermInfo(term: TermApiInfo): TermInfo {
  return {
    id: term.id,
    termbaseId: term.termbaseId,
    source: term.source,
    targets: term.targets,
    comment: term.comment ?? undefined,
    creatorId: term.creatorId,
    createdAt: term.createdAt,
    updatedAt: term.updatedAt,
  };
}

export async function listTerms(
  client: ApiClient,
  args: ListTermsArgs,
): Promise<Result<TermInfo[]>> {
  const query: ListTermsQuery = {
    fuzzySource: args.fuzzySource,
    offset: args.offset,
    limit: args.limit,
  };
  const result = await listTermsApi(client, args.termbaseId, query);
  if (!result.success) return result;
  return { success: true, data: result.data.map(toTermInfo) };
}

export async function getTerm(client: ApiClient, id: string): Promise<Result<TermInfo>> {
  const result = await getTermApi(client, id);
  if (!result.success) return result;
  return { success: true, data: toTermInfo(result.data) };
}

export async function createTerm(client: ApiClient, args: CreateTermArgs): Promise<Result<string>> {
  const body: CreateTermBody = {
    termbaseId: args.termbaseId,
    source: args.source,
    targets: args.targets,
    comment: args.comment,
  };
  const result = await createTermApi(client, body);
  if (!result.success) return result;
  return { success: true, data: result.data.id };
}

export function updateTerm(
  client: ApiClient,
  id: string,
  args: UpdateTermArgs,
): Promise<Result<undefined>> {
  const body: UpdateTermBody = {
    source: args.source,
    targets: args.targets,
    comment: args.comment,
  };
  return updateTermApi(client, id, body);
}

export function deleteTerm(client: ApiClient, id: string): Promise<Result<undefined>> {
  return deleteTermApi(client, id);
}
