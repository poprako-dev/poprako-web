import type { ApiClient } from "@/api/client";
import { decodeArray, decodeNumber, decodeObject, decodeString, decodeVoid } from "@/api/contract";
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

function decodeWorkset(value: unknown): WorksetResponse {
  const object = decodeObject(value, "workset");
  const { id, teamId, index, comicCount, name, description, createdAt, updatedAt } = object;
  return {
    id: decodeString(id, "workset.id"),
    teamId: decodeString(teamId, "workset.teamId"),
    index: decodeNumber(index, "workset.index"),
    comicCount: decodeNumber(comicCount, "workset.comicCount"),
    name: decodeString(name, "workset.name"),
    ...(description === undefined
      ? {}
      : {
          description:
            description === null ? null : decodeString(description, "workset.description"),
        }),
    createdAt: decodeNumber(createdAt, "workset.createdAt"),
    updatedAt: decodeNumber(updatedAt, "workset.updatedAt"),
  };
}

function decodeId(value: unknown): { id: string } {
  const { id } = decodeObject(value, "created workset");
  return { id: decodeString(id, "created workset.id") };
}

export function listWorksets(
  client: ApiClient,
  teamId: string,
  offset: number,
  limit: number,
): Promise<Result<WorksetResponse[]>> {
  return client.get(`/teams/${teamId}/worksets`, {
    query: { offset, limit },
    decode: (value) => decodeArray(value, decodeWorkset, "worksets"),
  });
}

export async function createWorkset(
  client: ApiClient,
  request: CreateWorksetRequest,
): Promise<Result<string>> {
  const result = await client.post("/worksets", request, { decode: decodeId });
  return result.success ? { success: true, data: result.data.id } : result;
}

export function updateWorkset(
  client: ApiClient,
  id: string,
  request: UpdateWorksetRequest,
): Promise<Result<undefined>> {
  return client.put(
    `/worksets/${id}`,
    { id, ...request },
    {
      decode: decodeVoid,
    },
  );
}

export function deleteWorkset(client: ApiClient, id: string): Promise<Result<undefined>> {
  return client.delete(`/worksets/${id}`, { decode: decodeVoid });
}
