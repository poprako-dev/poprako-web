import type { ApiClient } from "@/api/client";
import {
  decodeArray,
  decodeNullable,
  decodeNumber,
  decodeObject,
  decodeString,
  decodeVoid,
} from "@/api/contract";
import type { Result } from "@/shared/utility/result";

export type PageResponse = {
  id: string;
  chapterId: string;
  imageUrl?: string | null | undefined;
  imageOptimizedUrl?: string | null | undefined;
  imageThumbnailUrl?: string | null | undefined;
  imageHash?: string | null | undefined;
  ext?: string | null | undefined;
  index: number;
  proofreadUnitCount: number;
  totalUnitCount: number;
  translatedUnitCount: number;
  createdAt: number;
  updatedAt: number;
};

export type PageUnitFlaggedStatsResponse = {
  pageId: string;
  index: number;
  flaggedUnitCount: number;
};
export type PageUnitDiffStatsResponse = {
  pageId: string;
  index: number;
  translatedUnitCount: number;
  edittedUnitCount: number;
  proofreaderAppendUnitCount: number;
};
export type PageImageRequest = {
  pageId?: string | undefined;
  rawIdent?: string | undefined;
  imageHash: string;
  newByteLen?: number | undefined;
  ext: string;
};
export type AllocatedPageResponse = {
  pageId: string;
  index: number;
  imageHash: string;
  ext: string;
  slot: {
    putUrl: string;
    imageVersion: number;
    headers: Record<string, string>;
  } | null;
};

function optionalString(value: unknown, label: string): string | null | undefined {
  if (value === undefined) return undefined;
  return decodeNullable(value, (item) => decodeString(item, label), label);
}

function decodeStringMap(value: unknown): Record<string, string> {
  const object = decodeObject(value, "page upload headers");
  return Object.fromEntries(
    Object.entries(object).map(([key, item]) => [
      key,
      decodeString(item, `page upload headers.${key}`),
    ]),
  );
}

export function decodePage(value: unknown): PageResponse {
  const object = decodeObject(value, "page");
  const {
    id,
    chapterId,
    imageUrl,
    imageOptimizedUrl,
    imageThumbnailUrl,
    imageHash,
    ext,
    index,
    proofreadUnitCount,
    totalUnitCount,
    translatedUnitCount,
    createdAt,
    updatedAt,
  } = object;
  return {
    id: decodeString(id, "page.id"),
    chapterId: decodeString(chapterId, "page.chapterId"),
    ...(imageUrl === undefined ? {} : { imageUrl: optionalString(imageUrl, "page.imageUrl") }),
    ...(Object.hasOwn(object, "imageOptimizedUrl")
      ? {
          imageOptimizedUrl: optionalString(imageOptimizedUrl, "page.imageOptimizedUrl"),
        }
      : {}),
    ...(Object.hasOwn(object, "imageThumbnailUrl")
      ? {
          imageThumbnailUrl: optionalString(imageThumbnailUrl, "page.imageThumbnailUrl"),
        }
      : {}),
    ...(imageHash === undefined
      ? {}
      : {
          imageHash: decodeNullable(imageHash, (item) => decodeString(item, "page.imageHash")),
        }),
    ...(ext === undefined
      ? {}
      : { ext: decodeNullable(ext, (item) => decodeString(item, "page.ext")) }),
    index: decodeNumber(index, "page.index"),
    proofreadUnitCount: decodeNumber(proofreadUnitCount, "page.proofreadUnitCount"),
    totalUnitCount: decodeNumber(totalUnitCount, "page.totalUnitCount"),
    translatedUnitCount: decodeNumber(translatedUnitCount, "page.translatedUnitCount"),
    createdAt: decodeNumber(createdAt, "page.createdAt"),
    updatedAt: decodeNumber(updatedAt, "page.updatedAt"),
  };
}

function decodeFlaggedStats(value: unknown): PageUnitFlaggedStatsResponse {
  const { pageId, index, flaggedUnitCount } = decodeObject(value, "page flagged stats");
  return {
    pageId: decodeString(pageId, "page flagged stats.pageId"),
    index: decodeNumber(index, "page flagged stats.index"),
    flaggedUnitCount: decodeNumber(flaggedUnitCount, "page flagged stats.flaggedUnitCount"),
  };
}

function decodeDiffStats(value: unknown): PageUnitDiffStatsResponse {
  const { pageId, index, translatedUnitCount, edittedUnitCount, proofreaderAppendUnitCount } =
    decodeObject(value, "page diff stats");
  return {
    pageId: decodeString(pageId, "page diff stats.pageId"),
    index: decodeNumber(index, "page diff stats.index"),
    translatedUnitCount: decodeNumber(translatedUnitCount, "page diff stats.translatedUnitCount"),
    edittedUnitCount: decodeNumber(edittedUnitCount, "page diff stats.edittedUnitCount"),
    proofreaderAppendUnitCount: decodeNumber(
      proofreaderAppendUnitCount,
      "page diff stats.proofreaderAppendUnitCount",
    ),
  };
}

function decodeAllocatedPage(value: unknown): AllocatedPageResponse {
  const { pageId, index, imageHash, ext, slot: rawSlot } = decodeObject(value, "allocated page");
  let slot: AllocatedPageResponse["slot"] = null;
  if (rawSlot !== null) {
    const { putUrl, imageVersion, headers } = decodeObject(rawSlot, "allocated page.slot");
    slot = {
      putUrl: decodeString(putUrl, "allocated page.slot.putUrl"),
      imageVersion: decodeNumber(imageVersion, "allocated page.slot.imageVersion"),
      headers: decodeStringMap(headers),
    };
  }
  return {
    pageId: decodeString(pageId, "allocated page.pageId"),
    index: decodeNumber(index, "allocated page.index"),
    imageHash: decodeString(imageHash, "allocated page.imageHash"),
    ext: decodeString(ext, "allocated page.ext"),
    slot,
  };
}

export function listPages(
  client: ApiClient,
  chapterId: string,
  offset?: number,
  limit?: number,
): Promise<Result<PageResponse[]>> {
  return client.get(`/chapters/${chapterId}/pages`, {
    query: { offset, limit },
    decode: (value) => decodeArray(value, decodePage, "pages"),
  });
}
export function getPage(client: ApiClient, id: string): Promise<Result<PageResponse>> {
  return client.get(`/pages/${id}`, { decode: decodePage });
}
export function listPageUnitFlaggedStats(
  client: ApiClient,
  chapterId: string,
): Promise<Result<PageUnitFlaggedStatsResponse[]>> {
  return client.get(`/chapters/${chapterId}/pages/unit-flagged-stats`, {
    decode: (value) => decodeArray(value, decodeFlaggedStats, "page unit flagged stats"),
  });
}
export function listPageUnitDiffStats(
  client: ApiClient,
  chapterId: string,
): Promise<Result<PageUnitDiffStatsResponse[]>> {
  return client.get(`/chapters/${chapterId}/pages/unit-diff-stats`, {
    decode: (value) => decodeArray(value, decodeDiffStats, "page unit diff stats"),
  });
}
export function allocChapterPages(
  client: ApiClient,
  chapterId: string,
  pages: PageImageRequest[],
): Promise<Result<{ pages: AllocatedPageResponse[] }>> {
  return client.post(
    `/chapters/${chapterId}/pages/alloc`,
    { chapterId, pages },
    {
      decode: (value) => {
        const { pages } = decodeObject(value, "allocated pages");
        return {
          pages: decodeArray(pages, decodeAllocatedPage, "allocated pages.pages"),
        };
      },
    },
  );
}
export function allocExistingPageUpload(
  client: ApiClient,
  pageId: string,
  args: Omit<PageImageRequest, "pageId"> & { newByteLen: number },
): Promise<Result<AllocatedPageResponse>> {
  return client.post(`/pages/${pageId}/image/alloc`, args, {
    decode: decodeAllocatedPage,
  });
}
export function deleteChapterPages(
  client: ApiClient,
  chapterId: string,
): Promise<Result<undefined>> {
  return client.delete(`/chapters/${chapterId}/pages`, { decode: decodeVoid });
}
export function markPageImageUploaded(
  client: ApiClient,
  pageId: string,
  imageVersion: number,
): Promise<Result<undefined>> {
  return client.post(
    `/pages/${pageId}/image/mark-uploaded`,
    { imageVersion },
    {
      decode: decodeVoid,
    },
  );
}
export function uploadPageImage(
  client: ApiClient,
  options: {
    url: string;
    file: File;
    headers: Record<string, string>;
    onProgress?: ((percent: number) => void) | undefined;
    signal?: AbortSignal | undefined;
  },
): Promise<Result<undefined>> {
  return client.putPresigned(options);
}
