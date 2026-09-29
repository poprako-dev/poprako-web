import { decodeComicResponse } from "@/api/content-contract";
import type { ComicResponse } from "@/api/content-contract";
import type { ApiClient } from "@/api/client";
import {
  decodeNullable,
  decodeNumber,
  decodeObject,
  decodeString,
  decodeVoid,
} from "@/api/contract";
import { decodeChapterResponse } from "@/api/content-contract";
import type { ChapterResponse } from "@/api/content-contract";
import { decodeAssignment } from "@/api/content-contract";
import type { AssignmentResponse } from "@/api/content-contract";
import { decodeArray } from "@/api/contract";
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

function decodeId(value: unknown): { id: string } {
  const { id } = decodeObject(value, "comic result");
  return { id: decodeString(id, "comic result.id") };
}
function decodeArchive(value: unknown): { archivedComicId: string } {
  const { archivedComicId } = decodeObject(value, "comic archive result");
  return {
    archivedComicId: decodeString(archivedComicId, "comic archive result.archivedComicId"),
  };
}
function decodeCover(value: unknown): CoverUploadResponse {
  const { slot: rawSlot } = decodeObject(value, "comic cover allocation");
  if (rawSlot === null) return { slot: null };
  const { putUrl, imageVersion, headers: rawHeaders } = decodeObject(rawSlot, "comic cover slot");
  const headersObject = decodeObject(rawHeaders, "comic cover headers");
  const headers = Object.fromEntries(
    Object.entries(headersObject).map(([key, item]) => [key, decodeString(item, `header ${key}`)]),
  );
  return {
    slot: {
      putUrl: decodeString(putUrl, "comic cover slot.putUrl"),
      imageVersion: decodeNumber(imageVersion, "comic cover slot.imageVersion"),
      headers,
    },
  };
}

function decodeComicList(value: unknown): ComicListResponse {
  const object = decodeObject(value, "comic list");
  return {
    comics: decodeArray(object["comics"], decodeComicResponse, "comic list.comics"),
    pinnedChapters: decodeArray(
      object["pinnedChapters"],
      (item) => decodeNullable(item, decodeChapterResponse, "pinned chapter"),
      "comic list.pinnedChapters",
    ),
    pinnedChapterAssignments: decodeArray(
      object["pinnedChapterAssignments"],
      (items) => decodeArray(items, decodeAssignment, "pinned chapter assignments"),
      "comic list.pinnedChapterAssignments",
    ),
  };
}

export function listComics(
  client: ApiClient,
  worksetId: string,
  query: {
    includes?: readonly string[] | undefined;
    withs?: readonly string[] | undefined;
    fuzzyTitle?: string | undefined;
    stages?: number | undefined;
    offset: number;
    limit: number;
  },
): Promise<Result<ComicListResponse>> {
  return client.get(`/worksets/${worksetId}/comics`, {
    query: {
      incl: query.includes,
      with: query.withs,
      fuzzyTitle: query.fuzzyTitle,
      stages: query.stages,
      offset: query.offset,
      limit: query.limit,
    },
    decode: decodeComicList,
  });
}

export function getComic(
  client: ApiClient,
  id: string,
  includes: readonly string[] = [],
): Promise<Result<ComicResponse>> {
  return client.get(`/comics/${id}`, {
    query: { incl: includes },
    decode: decodeComicResponse,
  });
}
export function createComic(
  client: ApiClient,
  request: CreateComicRequest,
): Promise<Result<{ id: string }>> {
  return client.post("/comics", request, { decode: decodeId });
}
export function updateComic(
  client: ApiClient,
  id: string,
  request: UpdateComicRequest,
): Promise<Result<undefined>> {
  return client.put(
    `/comics/${id}`,
    { id, ...request },
    {
      decode: decodeVoid,
    },
  );
}
export function deleteComic(client: ApiClient, id: string): Promise<Result<undefined>> {
  return client.delete(`/comics/${id}`, { decode: decodeVoid });
}
export function archiveComic(
  client: ApiClient,
  id: string,
): Promise<Result<{ archivedComicId: string }>> {
  return client.post(`/comics/${id}/archive`, {}, { decode: decodeArchive });
}
export function allocComicCoverUpload(
  client: ApiClient,
  comicId: string,
  request: { imageHash: string; newByteLen: number; extension: string },
): Promise<Result<CoverUploadResponse>> {
  return client.post(
    `/comics/${comicId}/cover/alloc`,
    {
      imageHash: request.imageHash,
      newByteLen: request.newByteLen,
      ext: request.extension,
    },
    { decode: decodeCover },
  );
}
export function markComicCoverUploaded(
  client: ApiClient,
  comicId: string,
  imageVersion: number,
): Promise<Result<undefined>> {
  return client.post(
    `/comics/${comicId}/cover/mark-uploaded`,
    { imageVersion },
    { decode: decodeVoid },
  );
}
