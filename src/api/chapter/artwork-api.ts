import type { ApiClient } from "@/api/client";
import { decodeNumber, decodeObject, decodeString, decodeVoid } from "@/api/contract";
import type { Result } from "@/shared/utility/result";
export type ArtworkAllocation = {
  artworkVersion: number;
  slot: { putUrl: string; headers: Record<string, string> } | null;
};
function decodeAllocation(value: unknown): ArtworkAllocation {
  const object = decodeObject(value, "artwork allocation");
  const artworkVersion = decodeNumber(object["artworkVersion"], "artworkVersion");
  if (object["slot"] === null) return { artworkVersion, slot: null };
  const slot = decodeObject(object["slot"], "artwork slot");
  const headers = decodeObject(slot["headers"], "artwork headers");
  return {
    artworkVersion,
    slot: {
      putUrl: decodeString(slot["putUrl"], "putUrl"),
      headers: Object.fromEntries(
        Object.entries(headers).map(([key, value]) => [key, decodeString(value, key)]),
      ),
    },
  };
}
export function allocArtwork(
  client: ApiClient,
  chapterId: string,
  artworkHash: string,
  byteLength: number,
): Promise<Result<ArtworkAllocation>> {
  return client.post(
    `/chapters/${chapterId}/artwork/alloc`,
    { artworkHash, newByteLen: byteLength, ext: "xz" },
    { decode: decodeAllocation },
  );
}
export function markArtworkUploaded(
  client: ApiClient,
  chapterId: string,
  artworkVersion: number,
): Promise<Result<undefined>> {
  return client.post(
    `/chapters/${chapterId}/artwork/mark-uploaded`,
    { artworkVersion },
    { decode: decodeVoid },
  );
}
