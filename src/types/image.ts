export type ImageUploadSlot = {
  putUrl: string;
  imageVersion: number;
  headers: Record<string, string>;
};

export type ReserveImageArgs = {
  imageHash: string;
  newByteLen: number;
  extension: string;
};
