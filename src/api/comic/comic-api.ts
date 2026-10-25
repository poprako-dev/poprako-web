import type { ComicResponse } from "@/api/content-contract";
import type { ApiClient } from "@/api/client";
import type { ChapterResponse } from "@/api/content-contract";
import type { AssignmentResponse } from "@/api/content-contract";
import type { Result } from "@/shared/utility/result";

export type CreateComicRequest = {
  worksetId: string;
  title: string;
  author: string;
  description?: string | undefined;
  firstChapterSubtitle?: string | undefined;
  presetAssignmentRoles?: number | undefined;
};
export type UpdateComicRequest = {
  title: string;
  author: string;
  description?: string | undefined;
};
export type CoverUploadResponse = {
  slot: {
    putUrl: string;
    imageVersion: number;
    headers: Record<string, string>;
  } | null;
};
export type ComicListResponse = {
  comics: ComicResponse[];
  pinnedChapters: (ChapterResponse | null)[];
  pinnedChapterAssignments: AssignmentResponse[][];
};

export function listComics(
  client: ApiClient,
  worksetId: string,
  query: {
    includes?: readonly string[] | undefined;
    withs?: readonly string[] | undefined;
    fuzzyTitle?: string | undefined;
    stages?: number | undefined;
    status?: "active" | "archived" | undefined;
    offset: number;
    limit: number;
  },
  signal?: AbortSignal,
): Promise<Result<ComicListResponse>> {
  return client.get<ComicListResponse>(`/worksets/${worksetId}/comics`, {
    signal,
    query: {
      incl: query.includes,
      with: query.withs,
      fuzzyTitle: query.fuzzyTitle,
      stages: query.stages,
      status: query.status,
      offset: query.offset,
      limit: query.limit,
    },
  });
}

export function getComic(
  client: ApiClient,
  id: string,
  includes: readonly string[] = [],
): Promise<Result<ComicResponse>> {
  return client.get<ComicResponse>(`/comics/${id}`, {
    query: { incl: includes },
  });
}
export function createComic(
  client: ApiClient,
  request: CreateComicRequest,
): Promise<Result<{ id: string }>> {
  return client.post<{ id: string }>("/comics", request);
}
export function updateComic(
  client: ApiClient,
  id: string,
  request: UpdateComicRequest,
): Promise<Result<undefined>> {
  return client.put<undefined>(`/comics/${id}`, { id, ...request });
}
export function deleteComic(client: ApiClient, id: string): Promise<Result<undefined>> {
  return client.delete<undefined>(`/comics/${id}`);
}
export function archiveComic(
  client: ApiClient,
  id: string,
): Promise<Result<{ archivedComicId: string }>> {
  return client.post<{ archivedComicId: string }>(`/comics/${id}/archive`, {});
}
export function allocComicCoverUpload(
  client: ApiClient,
  comicId: string,
  request: { imageHash: string; newByteLen: number; extension: string },
): Promise<Result<CoverUploadResponse>> {
  return client.post<CoverUploadResponse>(`/comics/${comicId}/cover/alloc`, {
    imageHash: request.imageHash,
    newByteLen: request.newByteLen,
    ext: request.extension,
  });
}
export function markComicCoverUploaded(
  client: ApiClient,
  comicId: string,
  imageVersion: number,
): Promise<Result<undefined>> {
  return client.post<undefined>(`/comics/${comicId}/cover/mark-uploaded`, { imageVersion });
}
