import type { ImageUploadSlot } from "../image";

export type RawImageUploadSlot = {
  put_url: string;
  image_version: number;
  headers: Record<string, string>;
};

export type RawReserveImageResult = { slot: RawImageUploadSlot | null };

export function unwrapRawImageUploadSlot(raw: RawImageUploadSlot): ImageUploadSlot {
  return {
    putUrl: raw.put_url,
    imageVersion: raw.image_version,
    headers: raw.headers,
  };
}
