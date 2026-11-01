import type { UploadHeaders } from "@/api/upload-header";
export type ImageUploadSlot = {
  putUrl: string;
  imageVersion: number;
  headers: UploadHeaders;
};

export type AllocImageArgs = {
  imageHash: string;
  newByteLen: number;
  extension: string;
};
