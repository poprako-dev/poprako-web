import type { ApiClient } from "@/api/client";
import type { Result } from "@/shared/utility/result";
export type ArtworkAllocation = {
  artworkVersion: number;
  slot: { putUrl: string; headers: Record<string, string> } | null;
};
export function allocArtwork(
  client: ApiClient,
  chapterId: string,
  artworkHash: string,
  byteLength: number,
  signal?: AbortSignal,
): Promise<Result<ArtworkAllocation>> {
  return client.post<ArtworkAllocation>(
    `/chapters/${chapterId}/artwork/alloc`,
    { artworkHash, newByteLen: byteLength, ext: "zst" },
    { ...(signal ? { signal } : {}) },
  );
}
export function markArtworkUploaded(
  client: ApiClient,
  chapterId: string,
  artworkVersion: number,
  signal?: AbortSignal,
): Promise<Result<undefined>> {
  return client.post<undefined>(
    `/chapters/${chapterId}/artwork/mark-uploaded`,
    { artworkVersion },
    { ...(signal ? { signal } : {}) },
  );
}

export type ArtworkExport = {
  artworkVersion: number;
  artworkHash: string;
  ext: string;
  downloadUrl: string;
};
export function exportArtwork(
  client: ApiClient,
  chapterId: string,
  signal?: AbortSignal,
): Promise<Result<ArtworkExport>> {
  return client.get<ArtworkExport>("/chapters/" + chapterId + "/artwork/export", {
    ...(signal ? { signal } : {}),
  });
}
