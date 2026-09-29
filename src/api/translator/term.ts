import { decodeArray, decodeNumber, decodeObject, decodeString, decodeVoid } from "@/api/contract";
import type { ApiClient } from "@/api/client";
import type { Result } from "@/shared/utility/result";

export type TermApiInfo = {
  id: string;
  termbaseId: string;
  source: string;
  targets: string[];
  comment?: string | null | undefined;
  creatorId: string;
  createdAt: number;
  updatedAt: number;
};

export type ListTermsQuery = { fuzzySource?: string | undefined; offset: number; limit: number };
export type CreateTermBody = {
  termbaseId: string;
  source: string;
  targets: string[];
  comment?: string | undefined;
};
export type UpdateTermBody = Omit<CreateTermBody, "termbaseId">;

function decodeTerm(value: unknown): TermApiInfo {
  const record = decodeObject(value, "term");
  const comment =
    record["comment"] === undefined || record["comment"] === null
      ? record["comment"]
      : decodeString(record["comment"], "term.comment");
  return {
    id: decodeString(record["id"], "term.id"),
    termbaseId: decodeString(record["termbaseId"], "term.termbaseId"),
    source: decodeString(record["source"], "term.source"),
    targets: decodeArray(record["targets"], (item) => decodeString(item, "term target"), "targets"),
    comment,
    creatorId: decodeString(record["creatorId"], "term.creatorId"),
    createdAt: decodeNumber(record["createdAt"], "term.createdAt"),
    updatedAt: decodeNumber(record["updatedAt"], "term.updatedAt"),
  };
}

export function listTerms(
  client: ApiClient,
  termbaseId: string,
  query: ListTermsQuery,
): Promise<Result<TermApiInfo[]>> {
  return client.get(`/termbases/${termbaseId}/terms`, {
    query,
    decode: (value) => decodeArray(value, decodeTerm, "terms"),
  });
}

export function getTerm(client: ApiClient, id: string): Promise<Result<TermApiInfo>> {
  return client.get(`/terms/${id}`, { decode: decodeTerm });
}

export function createTerm(
  client: ApiClient,
  body: CreateTermBody,
): Promise<Result<{ id: string }>> {
  return client.post("/terms", body, {
    decode: (value) => ({
      id: decodeString(decodeObject(value, "created term")["id"], "id"),
    }),
  });
}

export function updateTerm(
  client: ApiClient,
  id: string,
  body: UpdateTermBody,
): Promise<Result<undefined>> {
  return client.put(`/terms/${id}`, { id, ...body }, { decode: decodeVoid });
}

export function deleteTerm(client: ApiClient, id: string): Promise<Result<undefined>> {
  return client.delete(`/terms/${id}`, { decode: decodeVoid });
}
