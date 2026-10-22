import type { ApiClient } from "@/api/client";
import type { Result } from "@/shared/utility/result";

export type TermbaseApiInfo = {
  id: string;
  teamId?: string | null | undefined;
  comicId?: string | null | undefined;
  name: string;
  description?: string | null | undefined;
  termCount: number;
  creatorId: string;
  createdAt: number;
  updatedAt: number;
};

export type ListComicTermbasesQuery = {
  fuzzyName?: string | undefined;
  offset: number;
  limit: number;
};
export type CreateComicTermbaseBody = {
  comicId: string;
  name: string;
  description?: string | undefined;
};
export type CreateTeamTermbaseBody = Omit<CreateComicTermbaseBody, "comicId"> & {
  teamId: string;
};
export type UpdateTermbaseBody = { name: string; description?: string | undefined };
export type ImportTermbaseBody = {
  name: string;
  description?: string | null | undefined;
  terms: { source: string; targets: string[]; comment?: string | null | undefined }[];
};

export type ImportTermbaseApiResult = {
  id: string;
  created: boolean;
  createdTermCount: number;
  mergedTermCount: number;
};

export function importComicTermbase(
  client: ApiClient,
  comicId: string,
  document: ImportTermbaseBody,
): Promise<Result<ImportTermbaseApiResult>> {
  return importTermbaseDocument(client, `/comics/${comicId}/termbases/import`, document);
}

export function importTeamTermbase(
  client: ApiClient,
  teamId: string,
  document: ImportTermbaseBody,
): Promise<Result<ImportTermbaseApiResult>> {
  return importTermbaseDocument(client, `/teams/${teamId}/termbases/import`, document);
}

function importTermbaseDocument(
  client: ApiClient,
  path: string,
  document: ImportTermbaseBody,
): Promise<Result<ImportTermbaseApiResult>> {
  return client.post<ImportTermbaseApiResult>(path, document, {
    // TODO: 设计强制合并的 UI/UX 后再开放 forceMerge；当前同名导入保持报错。
    query: { forceMerge: false },
  });
}

export function listComicTermbases(
  client: ApiClient,
  comicId: string,
  query: ListComicTermbasesQuery,
): Promise<Result<TermbaseApiInfo[]>> {
  return client.get<TermbaseApiInfo[]>(`/comics/${comicId}/termbases`, {
    query,
  });
}

export function getTermbase(client: ApiClient, id: string): Promise<Result<TermbaseApiInfo>> {
  return client.get<TermbaseApiInfo>(`/termbases/${id}`);
}

export function listTeamTermbases(
  client: ApiClient,
  teamId: string,
  query: ListComicTermbasesQuery,
): Promise<Result<TermbaseApiInfo[]>> {
  return client.get<TermbaseApiInfo[]>(`/teams/${teamId}/termbases`, {
    query,
  });
}

export function createTeamTermbase(
  client: ApiClient,
  body: CreateTeamTermbaseBody,
): Promise<Result<{ id: string }>> {
  return client.post<{ id: string }>("/termbases", body);
}

export function exportTermbase(
  client: ApiClient,
  id: string,
  signal?: AbortSignal,
): Promise<Result<string>> {
  return client.getText(`/termbases/${id}/export/download`, { signal });
}

export function createComicTermbase(
  client: ApiClient,
  body: CreateComicTermbaseBody,
): Promise<Result<{ id: string }>> {
  return client.post<{ id: string }>("/termbases", body);
}

export function updateTermbase(
  client: ApiClient,
  id: string,
  body: UpdateTermbaseBody,
): Promise<Result<undefined>> {
  return client.put<undefined>(`/termbases/${id}`, { id, ...body });
}

export function deleteTermbase(client: ApiClient, id: string): Promise<Result<undefined>> {
  return client.delete<undefined>(`/termbases/${id}`);
}
