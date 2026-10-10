import { ApiDecodeError } from "@/api/api-error";
import type { ApiClient } from "@/api/client";
import {
  decodeArray,
  decodeBoolean,
  decodeNumber,
  decodeObject,
  decodeString,
  decodeVoid,
} from "@/api/contract";
import type { Result } from "@/shared/utility/result";

export type PageArtwork = {
  id: string;
  chapterId: string;
  index: number;
  rawIdent: string | null;
  imageUrl: string | null;
  imageOptimizedUrl: string | null;
  imageThumbnailUrl: string | null;
  imageHash: string | null;
  ext: string | null;
  imageVersion: number | null;
  imageUploaded: boolean;
  createdAt: number;
  updatedAt: number;
};
export type ArtworkImageInput = {
  pageArtworkId?: string;
  rawIdent: string | null;
  imageHash: string;
  newByteLen?: number;
  ext: string;
};
export type ArtworkImageAllocation = {
  pageArtworkId: string;
  index: number;
  imageVersion: number;
  imageHash: string;
  ext: string;
  slot: { putUrl: string; headers: Record<string, string>; imageVersion: number } | null;
};
function decodeOrdinal(value: unknown): number {
  const number = decodeNumber(value);
  if (!Number.isSafeInteger(number) || number < 0)
    throw new ApiDecodeError("成稿序号或版本必须为非负整数");
  return number;
}
function nullableString(value: unknown): string | null {
  return value === null || value === undefined ? null : decodeString(value);
}
export function decodePageArtwork(value: unknown): PageArtwork {
  const page = decodeObject(value, "page artwork");
  return {
    id: decodeString(page["id"]),
    chapterId: decodeString(page["chapterId"]),
    index: decodeOrdinal(page["index"]),
    rawIdent: nullableString(page["rawIdent"]),
    imageUrl: nullableString(page["imageUrl"]),
    imageOptimizedUrl: nullableString(page["imageOptimizedUrl"]),
    imageThumbnailUrl: nullableString(page["imageThumbnailUrl"]),
    imageHash: nullableString(page["imageHash"]),
    ext: nullableString(page["ext"]),
    imageVersion: page["imageVersion"] === null ? null : decodeOrdinal(page["imageVersion"]),
    imageUploaded: decodeBoolean(page["imageUploaded"]),
    createdAt: decodeNumber(page["createdAt"]),
    updatedAt: decodeNumber(page["updatedAt"]),
  };
}
function decodeAllocation(value: unknown): ArtworkImageAllocation {
  const item = decodeObject(value, "page artwork allocation");
  const slot = item["slot"] === null ? null : decodeObject(item["slot"]);
  return {
    pageArtworkId: decodeString(item["pageArtworkId"]),
    index: decodeOrdinal(item["index"]),
    imageVersion: decodeOrdinal(item["imageVersion"]),
    imageHash: decodeString(item["imageHash"]),
    ext: decodeString(item["ext"]),
    slot:
      slot === null
        ? null
        : {
            putUrl: decodeString(slot["putUrl"]),
            imageVersion: decodeOrdinal(slot["imageVersion"]),
            headers: Object.fromEntries(
              Object.entries(decodeObject(slot["headers"])).map(([key, value]) => [
                key,
                decodeString(value),
              ]),
            ),
          },
  };
}
export function listPageArtworks(
  client: ApiClient,
  chapterId: string,
  signal?: AbortSignal,
): Promise<Result<PageArtwork[]>> {
  return client.get(`/chapters/${chapterId}/page-artworks`, {
    decode: (value) => decodeArray(value, decodePageArtwork),
    ...(signal ? { signal } : {}),
  });
}
export function allocatePageArtworks(
  client: ApiClient,
  chapterId: string,
  pages: ArtworkImageInput[],
  signal: AbortSignal,
): Promise<Result<ArtworkImageAllocation[]>> {
  return client.post(
    `/chapters/${chapterId}/page-artworks/alloc`,
    { pages },
    {
      signal,
      decode: (value) => decodeArray(decodeObject(value)["pages"], decodeAllocation),
    },
  );
}
export function allocateArtworkImage(
  client: ApiClient,
  id: string,
  input: Omit<ArtworkImageInput, "pageArtworkId"> & { newByteLen: number },
  signal: AbortSignal,
): Promise<Result<ArtworkImageAllocation>> {
  return client.post(`/page-artworks/${id}/image/alloc`, input, {
    signal,
    decode: decodeAllocation,
  });
}
export function confirmArtworkImage(
  client: ApiClient,
  id: string,
  imageVersion: number,
  signal: AbortSignal,
): Promise<Result<undefined>> {
  return client.post(
    `/page-artworks/${id}/image/mark-uploaded`,
    { imageVersion },
    { signal, decode: decodeVoid },
  );
}
