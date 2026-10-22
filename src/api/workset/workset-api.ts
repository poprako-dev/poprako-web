import type { ApiClient } from "@/api/client";
import type { Result } from "@/shared/utility/result";

export type WorksetResponse = {
  id: string;
  teamId: string;
  index: number;
  comicCount: number;
  name: string;
  description?: string | null | undefined;
  createdAt: number;
  updatedAt: number;
};

export type CreateWorksetRequest = {
  teamId: string;
  name: string;
  description?: string | undefined;
};

export type UpdateWorksetRequest = {
  name: string;
  description?: string | undefined;
};

export function listWorksets(
  client: ApiClient,
  teamId: string,
  offset: number,
  limit: number,
  signal?: AbortSignal,
): Promise<Result<WorksetResponse[]>> {
  return client.get<WorksetResponse[]>(`/teams/${teamId}/worksets`, {
    query: { offset, limit },
    ...(signal ? { signal } : {}),
  });
}

export async function createWorkset(
  client: ApiClient,
  request: CreateWorksetRequest,
): Promise<Result<string>> {
  const result = await client.post<{ id: string }>("/worksets", request);
  return result.success ? { success: true, data: result.data.id } : result;
}

export function updateWorkset(
  client: ApiClient,
  id: string,
  request: UpdateWorksetRequest,
): Promise<Result<undefined>> {
  return client.put<undefined>(`/worksets/${id}`, { id, ...request });
}

export function deleteWorkset(client: ApiClient, id: string): Promise<Result<undefined>> {
  return client.delete<undefined>(`/worksets/${id}`);
}
