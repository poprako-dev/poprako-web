export type ArchiveFile = {
  /**
  Relative archive path; File.name can be used directly.
  */
  name: string;
  blob: Blob;
};

export type ArchiveProgress = {
  completedFiles: number;
  processedBytes: number;
};

export type ArchiveOptions = {
  signal?: AbortSignal;
  onProgress?: (progress: ArchiveProgress) => void;
  /**
  XZ preset 0–6. Default 3 keeps encoder memory below the WASM heap limit.
  */
  preset?: number;
  /**
  Maximum uncompressed file bytes. Default 8 GiB.
  */
  maxBytes?: number;
  /**
  Maximum number of archive entries. Default 1000.
  */
  maxFiles?: number;
};

export type ZipOptions = ArchiveOptions & {
  /**
  Add translations or images to the same ZIP after the extracted PSDs.
  */
  extraFiles?: readonly ArchiveFile[];
};

export type WorkerJob = {
  operation: "compress" | "decompress";
  files: readonly ArchiveFile[];
  source?: ReadableStream<Uint8Array>;
  preset: number;
  maxBytes: number;
  maxFiles: number;
};

export type WorkerReply =
  | { type: "chunk"; chunk: Uint8Array<ArrayBuffer> }
  | { type: "progress"; progress: ArchiveProgress }
  | { type: "done" }
  | { type: "error"; message: string };
