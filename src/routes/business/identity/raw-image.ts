import type { ImageUploadSlot } from "@/routes/business/identity/image";

export type RawImageUploadSlot = {
  put_url: string;
  image_version: number;
  headers: Record<string, string>;
};

export type RawAllocImageResult = {
  slot: RawImageUploadSlot | null;
};

export function unwrapRawImageUploadSlot(raw: RawImageUploadSlot): ImageUploadSlot {
  return {
    putUrl: raw.put_url,
    imageVersion: raw.image_version,
    headers: raw.headers,
  };
}
