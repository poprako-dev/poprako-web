import type { ApiClient } from "@/api/client";
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

export function listPages(
  client: ApiClient,
  chapterId: string,
  offset?: number,
  limit?: number,
  signal?: AbortSignal,
): Promise<Result<PageResponse[]>> {
  return client.get<PageResponse[]>(`/chapters/${chapterId}/pages`, {
    query: { offset, limit },
    signal,
  });
}
export function getPage(client: ApiClient, id: string): Promise<Result<PageResponse>> {
  return client.get<PageResponse>(`/pages/${id}`);
}
export function listPageUnitFlaggedStats(
  client: ApiClient,
  chapterId: string,
): Promise<Result<PageUnitFlaggedStatsResponse[]>> {
  return client.get<PageUnitFlaggedStatsResponse[]>(
    `/chapters/${chapterId}/pages/unit-flagged-stats`,
  );
}
export function listPageUnitDiffStats(
  client: ApiClient,
  chapterId: string,
): Promise<Result<PageUnitDiffStatsResponse[]>> {
  return client.get<PageUnitDiffStatsResponse[]>(`/chapters/${chapterId}/pages/unit-diff-stats`);
}
export function allocChapterPages(
  client: ApiClient,
  chapterId: string,
  pages: PageImageRequest[],
): Promise<Result<{ pages: AllocatedPageResponse[] }>> {
  return client.post<{ pages: AllocatedPageResponse[] }>(`/chapters/${chapterId}/pages/alloc`, {
    chapterId,
    pages,
  });
}
export function allocExistingPageUpload(
  client: ApiClient,
  pageId: string,
  args: Omit<PageImageRequest, "pageId"> & { newByteLen: number },
): Promise<Result<AllocatedPageResponse>> {
  return client.post<AllocatedPageResponse>(`/pages/${pageId}/image/alloc`, args);
}
export function deleteChapterPages(
  client: ApiClient,
  chapterId: string,
): Promise<Result<undefined>> {
  return client.delete<undefined>(`/chapters/${chapterId}/pages`);
}
export function markPageImageUploaded(
  client: ApiClient,
  pageId: string,
  imageVersion: number,
): Promise<Result<undefined>> {
  return client.post<undefined>(`/pages/${pageId}/image/mark-uploaded`, { imageVersion });
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
