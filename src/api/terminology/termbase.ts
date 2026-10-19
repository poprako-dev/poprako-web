import {
  decodeArray,
  decodeBoolean,
  decodeNumber,
  decodeObject,
  decodeString,
  decodeVoid,
} from "@/api/contract";
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

export type ImportTermbaseApiResult = {
  id: string;
  created: boolean;
  createdTermCount: number;
  mergedTermCount: number;
};

export function importComicTermbase(
  client: ApiClient,
  comicId: string,
  document: unknown,
): Promise<Result<ImportTermbaseApiResult>> {
  return importTermbaseDocument(client, `/comics/${comicId}/termbases/import`, document);
}

export function importTeamTermbase(
  client: ApiClient,
  teamId: string,
  document: unknown,
): Promise<Result<ImportTermbaseApiResult>> {
  return importTermbaseDocument(client, `/teams/${teamId}/termbases/import`, document);
}

function importTermbaseDocument(
  client: ApiClient,
  path: string,
  document: unknown,
): Promise<Result<ImportTermbaseApiResult>> {
  return client.post(path, document, {
    // TODO: 设计强制合并的 UI/UX 后再开放 forceMerge；当前同名导入保持报错。
    query: { forceMerge: false },
    decode: (value) => {
      const record = decodeObject(value, "imported termbase");
      return {
        id: decodeString(record["id"], "id"),
        created: decodeBoolean(record["created"], "created"),
        createdTermCount: decodeNumber(record["createdTermCount"], "createdTermCount"),
        mergedTermCount: decodeNumber(record["mergedTermCount"], "mergedTermCount"),
      };
    },
  });
}

function optionalNullableString(
  record: Record<string, unknown>,
  key: string,
): string | null | undefined {
  const value = record[key];
  return value === undefined || value === null ? value : decodeString(value, key);
}

function decodeTermbase(value: unknown): TermbaseApiInfo {
  const record = decodeObject(value, "termbase");
  return {
    id: decodeString(record["id"], "termbase.id"),
    teamId: optionalNullableString(record, "teamId"),
    comicId: optionalNullableString(record, "comicId"),
    name: decodeString(record["name"], "termbase.name"),
    description: optionalNullableString(record, "description"),
    termCount: decodeNumber(record["termCount"], "termbase.termCount"),
    creatorId: decodeString(record["creatorId"], "termbase.creatorId"),
    createdAt: decodeNumber(record["createdAt"], "termbase.createdAt"),
    updatedAt: decodeNumber(record["updatedAt"], "termbase.updatedAt"),
  };
}

export function listComicTermbases(
  client: ApiClient,
  comicId: string,
  query: ListComicTermbasesQuery,
): Promise<Result<TermbaseApiInfo[]>> {
  return client.get(`/comics/${comicId}/termbases`, {
    query,
    decode: (value) => decodeArray(value, decodeTermbase, "termbases"),
  });
}

export function getTermbase(client: ApiClient, id: string): Promise<Result<TermbaseApiInfo>> {
  return client.get(`/termbases/${id}`, { decode: decodeTermbase });
}

export function listTeamTermbases(
  client: ApiClient,
  teamId: string,
  query: ListComicTermbasesQuery,
): Promise<Result<TermbaseApiInfo[]>> {
  return client.get(`/teams/${teamId}/termbases`, {
    query,
    decode: (value) => decodeArray(value, decodeTermbase, "termbases"),
  });
}

export function createTeamTermbase(
  client: ApiClient,
  body: CreateTeamTermbaseBody,
): Promise<Result<{ id: string }>> {
  return client.post("/termbases", body, {
    decode: (value) => ({
      id: decodeString(decodeObject(value, "created termbase")["id"], "id"),
    }),
  });
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
  return client.post("/termbases", body, {
    decode: (value) => ({
      id: decodeString(decodeObject(value, "created termbase")["id"], "id"),
    }),
  });
}

export function updateTermbase(
  client: ApiClient,
  id: string,
  body: UpdateTermbaseBody,
): Promise<Result<undefined>> {
  return client.put(`/termbases/${id}`, { id, ...body }, { decode: decodeVoid });
}

export function deleteTermbase(client: ApiClient, id: string): Promise<Result<undefined>> {
  return client.delete(`/termbases/${id}`, { decode: decodeVoid });
}
