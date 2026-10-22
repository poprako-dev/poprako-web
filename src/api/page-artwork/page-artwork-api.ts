import type { ApiClient } from "@/api/client";
import type { Result } from "@/shared/utility/result";

export type PageArtwork = {
  id: string;
  chapterId: string;
  index: number;
  rawIdent?: string | null | undefined;
  imageUrl?: string | null | undefined;
  imageOptimizedUrl?: string | null | undefined;
  imageThumbnailUrl?: string | null | undefined;
  imageHash?: string | null | undefined;
  ext?: string | null | undefined;
  imageVersion?: number | null | undefined;
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
export function listPageArtworks(
  client: ApiClient,
  chapterId: string,
  signal?: AbortSignal,
): Promise<Result<PageArtwork[]>> {
  return client.get<PageArtwork[]>(`/chapters/${chapterId}/page-artworks`, {
    ...(signal ? { signal } : {}),
  });
}
export async function allocatePageArtworks(
  client: ApiClient,
  chapterId: string,
  pages: ArtworkImageInput[],
  signal: AbortSignal,
): Promise<Result<ArtworkImageAllocation[]>> {
  const result = await client.post<{ pages: ArtworkImageAllocation[] }>(
    `/chapters/${chapterId}/page-artworks/alloc`,
    { pages },
    {
      signal,
    },
  );
  return result.success ? { success: true, data: result.data.pages } : result;
}
export function allocateArtworkImage(
  client: ApiClient,
  id: string,
  input: Omit<ArtworkImageInput, "pageArtworkId"> & { newByteLen: number },
  signal: AbortSignal,
): Promise<Result<ArtworkImageAllocation>> {
  return client.post<ArtworkImageAllocation>(`/page-artworks/${id}/image/alloc`, input, {
    signal,
  });
}
export function confirmArtworkImage(
  client: ApiClient,
  id: string,
  imageVersion: number,
  signal: AbortSignal,
): Promise<Result<undefined>> {
  return client.post<undefined>(
    `/page-artworks/${id}/image/mark-uploaded`,
    { imageVersion },
    { signal },
  );
}
