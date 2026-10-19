import type { ApiClient } from "@/api/client";
import {
  createComicTermbase as createComicTermbaseApi,
  deleteTermbase as deleteTermbaseApi,
  exportTermbase as exportTermbaseApi,
  getTermbase as getTermbaseApi,
  importComicTermbase as importComicTermbaseApi,
  listComicTermbases as listComicTermbasesApi,
  updateTermbase as updateTermbaseApi,
  type CreateComicTermbaseBody,
  type ListComicTermbasesQuery,
  type TermbaseApiInfo,
  type UpdateTermbaseBody,
} from "@/api/terminology/termbase";
import type { Result } from "@/shared/utility/result";
import type { TermbaseInfo } from "./termbase";
import type {
  CreateComicTermbaseArgs,
  ImportTermbaseResult,
  ListComicTermbasesArgs,
  UpdateTermbaseArgs,
} from "./termbase-input";

export function importComicTermbase(
  client: ApiClient,
  comicId: string,
  content: string,
): Promise<Result<ImportTermbaseResult>> {
  let document: unknown;
  try {
    document = JSON.parse(content);
  } catch (error) {
    console.error("[TerminologyLookup] 解析术语库 JSON 失败", error);
    return Promise.resolve({ success: false, error: "术语库文件不是有效的 JSON" });
  }
  return importComicTermbaseApi(client, comicId, document);
}

export function toTermbaseInfo(termbase: TermbaseApiInfo): TermbaseInfo {
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

export function exportTermbase(
  client: ApiClient,
  id: string,
  signal?: AbortSignal,
): Promise<Result<string>> {
  return exportTermbaseApi(client, id, signal);
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
