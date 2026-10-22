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

export function listTerms(
  client: ApiClient,
  termbaseId: string,
  query: ListTermsQuery,
): Promise<Result<TermApiInfo[]>> {
  return client.get<TermApiInfo[]>(`/termbases/${termbaseId}/terms`, {
    query,
  });
}

export function getTerm(client: ApiClient, id: string): Promise<Result<TermApiInfo>> {
  return client.get<TermApiInfo>(`/terms/${id}`);
}

export function createTerm(
  client: ApiClient,
  body: CreateTermBody,
): Promise<Result<{ id: string }>> {
  return client.post<{ id: string }>("/terms", body);
}

export function updateTerm(
  client: ApiClient,
  id: string,
  body: UpdateTermBody,
): Promise<Result<undefined>> {
  return client.put<undefined>(`/terms/${id}`, { id, ...body });
}

export function deleteTerm(client: ApiClient, id: string): Promise<Result<undefined>> {
  return client.delete<undefined>(`/terms/${id}`);
}
