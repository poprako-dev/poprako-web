import type { ApiClient } from "@/api/client";
import {
  createComicTermbase as createComicTermbaseApi,
  deleteTermbase as deleteTermbaseApi,
  getTermbase as getTermbaseApi,
  listComicTermbases as listComicTermbasesApi,
  updateTermbase as updateTermbaseApi,
  type CreateComicTermbaseBody,
  type ListComicTermbasesQuery,
  type TermbaseApiInfo,
  type UpdateTermbaseBody,
} from "@/api/translator/termbase";
import type { Result } from "@/shared/utility/result";
import type { TermbaseInfo } from "@/route/_authenticated/translator/business/terminology/termbase";
import type {
  CreateComicTermbaseArgs,
  ListComicTermbasesArgs,
  UpdateTermbaseArgs,
} from "@/route/_authenticated/translator/business/terminology/termbase-input";

function toTermbaseInfo(termbase: TermbaseApiInfo): TermbaseInfo {
  return {
    id: termbase.id,
    teamId: termbase.teamId ?? undefined,
    comicId: termbase.comicId ?? undefined,
    name: termbase.name,
    description: termbase.description ?? undefined,
    termCount: termbase.termCount,
    creatorId: termbase.creatorId,
    createdAt: termbase.createdAt,
    updatedAt: termbase.updatedAt,
  };
}

export async function listComicTermbases(
  client: ApiClient,
  args: ListComicTermbasesArgs,
): Promise<Result<TermbaseInfo[]>> {
  const query: ListComicTermbasesQuery = {
    fuzzyName: args.fuzzyName,
    offset: args.offset,
    limit: args.limit,
  };
  const result = await listComicTermbasesApi(client, args.comicId, query);
  if (!result.success) return result;
  return { success: true, data: result.data.map(toTermbaseInfo) };
}

export async function getTermbase(client: ApiClient, id: string): Promise<Result<TermbaseInfo>> {
  const result = await getTermbaseApi(client, id);
  if (!result.success) return result;
  return { success: true, data: toTermbaseInfo(result.data) };
}

export async function createComicTermbase(
  client: ApiClient,
  args: CreateComicTermbaseArgs,
): Promise<Result<string>> {
  const body: CreateComicTermbaseBody = {
    comicId: args.comicId,
    name: args.name,
    description: args.description,
  };
  const result = await createComicTermbaseApi(client, body);
  if (!result.success) return result;
  return { success: true, data: result.data.id };
}

export function updateTermbase(
  client: ApiClient,
  id: string,
  args: UpdateTermbaseArgs,
): Promise<Result<undefined>> {
  const body: UpdateTermbaseBody = {
    name: args.name,
    description: args.description,
  };
  return updateTermbaseApi(client, id, body);
}

export function deleteTermbase(client: ApiClient, id: string): Promise<Result<undefined>> {
  return deleteTermbaseApi(client, id);
}
