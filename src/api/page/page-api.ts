import type { ApiClient } from "@/api/client";
import type { Result } from "@/shared/utility/result";

export type PageResponse = {
  id: string;
  chapterId: string;
  rawIdent?: string | null | undefined;
  imageVersion?: number | null | undefined;
  imageUploaded: boolean;
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
  pageSourceId: string;
  index: number;
  flaggedUnitCount: number;
};
export type PageUnitDiffStatsResponse = {
  pageSourceId: string;
  index: number;
  translatedUnitCount: number;
  edittedUnitCount: number;
  proofreaderAppendUnitCount: number;
};
export type PageImageRequest = {
  pageSourceId?: string | undefined;
  rawIdent?: string | undefined;
  imageHash: string;
  newByteLen?: number | undefined;
  ext: string;
};
export type AllocatedPageResponse = {
  pageSourceId: string;
  imageVersion: number;
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
  return client.get<PageResponse[]>(`/chapters/${chapterId}/page-sources`, {
    query: { offset, limit },
    signal,
  });
}
export function getPage(client: ApiClient, id: string): Promise<Result<PageResponse>> {
  return client.get<PageResponse>(`/page-sources/${id}`);
}
export function listPageUnitFlaggedStats(
  client: ApiClient,
  chapterId: string,
): Promise<Result<PageUnitFlaggedStatsResponse[]>> {
  return client.get<PageUnitFlaggedStatsResponse[]>(
    `/chapters/${chapterId}/page-sources/unit-flagged-stats`,
  );
}
export function listPageUnitDiffStats(
  client: ApiClient,
  chapterId: string,
): Promise<Result<PageUnitDiffStatsResponse[]>> {
  return client.get<PageUnitDiffStatsResponse[]>(
    `/chapters/${chapterId}/page-sources/unit-diff-stats`,
  );
}
export function allocChapterPages(
  client: ApiClient,
  chapterId: string,
  pages: PageImageRequest[],
): Promise<Result<{ pages: AllocatedPageResponse[] }>> {
  return client.post<{ pages: AllocatedPageResponse[] }>(
    `/chapters/${chapterId}/page-sources/alloc`,
    {
      pages,
    },
  );
}
export function allocExistingPageUpload(
  client: ApiClient,
  pageSourceId: string,
  args: Omit<PageImageRequest, "pageSourceId"> & { newByteLen: number },
): Promise<Result<AllocatedPageResponse>> {
  return client.post<AllocatedPageResponse>(`/page-sources/${pageSourceId}/image/alloc`, args);
}
export function deleteChapterPages(
  client: ApiClient,
  chapterId: string,
): Promise<Result<undefined>> {
  return client.delete<undefined>(`/chapters/${chapterId}/page-sources`);
}
export function markPageImageUploaded(
  client: ApiClient,
  pageSourceId: string,
  imageVersion: number,
): Promise<Result<undefined>> {
  return client.post<undefined>(`/page-sources/${pageSourceId}/image/mark-uploaded`, {
    imageVersion,
  });
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
