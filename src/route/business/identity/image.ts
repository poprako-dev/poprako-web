export type ImageUploadSlot = {
  putUrl: string;
  imageVersion: number;
  headers: Record<string, string>;
};

export type AllocImageArgs = {
  imageHash: string;
  newByteLen: number;
  extension: string;
};
