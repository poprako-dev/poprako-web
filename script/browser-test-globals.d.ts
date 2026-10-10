/// <reference lib="dom" />

type BrowserZipEntry = {
  filename: string;
  getData(writer: BrowserBlobWriter, options?: Record<string, unknown>): Promise<Blob>;
};

type BrowserZipReader = {
  getEntries(): Promise<BrowserZipEntry[]>;
  close(): Promise<void>;
};

type BrowserBlobReader = { stream(): ReadableStream<Uint8Array> };
type BrowserBlobWriter = { getData(): Promise<Blob> };

type BoundedBrowserTools = {
  prepareBoundedArchive(
    items: readonly object[],
    body: string,
    cover: string,
    signal: AbortSignal,
    onProgress: (completed: number) => void,
  ): Promise<{ file: File; dispose(): Promise<void> }>;
  ZipReader: new (reader: BrowserBlobReader) => BrowserZipReader;
  BlobReader: new (blob: Blob) => BrowserBlobReader;
  BlobWriter: new () => BrowserBlobWriter;
  run(): Promise<{ sizes: number[]; png: number[] }>;
};

type CompressBrowserTools = {
  compressTarXz(
    files: readonly { name: string; blob: Blob }[],
    options?: Record<string, unknown>,
  ): ReadableStream<Uint8Array>;
  decompressTarXzToZip(
    source: Blob | ReadableStream<Uint8Array>,
    options?: Record<string, unknown>,
  ): ReadableStream<Uint8Array>;
  ZipReader: new (reader: BrowserBlobReader) => BrowserZipReader;
  BlobReader: new (blob: Blob) => BrowserBlobReader;
  BlobWriter: new () => BrowserBlobWriter;
  run(large: boolean, preset: number): Promise<Record<string, unknown>>;
};

declare global {
  var boundedTest: BoundedBrowserTools;
  var testArchive: CompressBrowserTools;
}

export {};
