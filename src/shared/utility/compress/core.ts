import { createTarDecoder, createTarPacker, type TarHeader } from "modern-tar";
import { ZipWriter } from "@zip.js/zip.js";
import { xzStream } from "@/shared/utility/compress/xz";
import type { ArchiveFile, ArchiveProgress, WorkerJob } from "@/shared/utility/compress/types";

export function validateName(name: string): void {
  if (!name || name.includes("\\") || name.includes(":")) {
    throw new Error(`Invalid archive path: ${name}`);
  }
  // eslint-disable-next-line no-control-regex -- archive paths cannot contain control characters.
  if (/[\u{0}-\u{1F}\u{7F}]/u.test(name)) {
    throw new Error("Invalid archive path");
  }
  const parts = name.replace(/\/$/u, "").split("/");
  if (parts.some((part) => !part || part === "." || part === "..")) {
    throw new Error(`Unsafe archive path: ${name}`);
  }
  if (new TextEncoder().encode(name).length > 4096) {
    throw new Error("Archive path too long");
  }
}

export function validateJob(job: WorkerJob): void {
  if (!Number.isSafeInteger(job.preset) || job.preset < 0 || job.preset > 6) {
    throw new Error("XZ preset must be an integer between 0 and 6");
  }
  for (const limit of [job.maxBytes, job.maxFiles]) {
    if (!Number.isSafeInteger(limit) || limit < 1) {
      throw new Error("Invalid archive limit");
    }
  }
}

class ArchiveTracker {
  private readonly seen = new Set<string>();
  private processedBytes = 0;
  private completedFiles = 0;
  private readonly job: WorkerJob;
  private readonly progress: (value: ArchiveProgress) => void;

  constructor(job: WorkerJob, progress: (value: ArchiveProgress) => void) {
    this.job = job;
    this.progress = progress;
  }

  register(name: string, size: number): void {
    validateName(name);
    const key = name.replace(/\/$/u, "").normalize("NFC").toLowerCase();
    if (this.seen.has(key)) {
      throw new Error(`Duplicate archive path: ${name}`);
    }
    this.seen.add(key);
    this.processedBytes += size;
    if (!Number.isSafeInteger(size) || size < 0 || this.processedBytes > this.job.maxBytes) {
      throw new Error("Archive exceeds the uncompressed byte limit");
    }
    if (this.seen.size > this.job.maxFiles) {
      throw new Error("Archive exceeds the entry limit");
    }
  }

  resetBytes(): void {
    this.processedBytes = 0;
  }

  report(size = 0): void {
    this.processedBytes += size;
    this.completedFiles++;
    this.progress({ processedBytes: this.processedBytes, completedFiles: this.completedFiles });
  }
}

async function compressArchive(
  job: WorkerJob,
  output: WritableStream<Uint8Array>,
  tracker: ArchiveTracker,
): Promise<void> {
  for (const file of job.files) {
    if (file.name.endsWith("/")) {
      throw new Error("A file path cannot end with a slash");
    }
    tracker.register(file.name, file.blob.size);
  }
  tracker.resetBytes();
  const tar = createTarPacker();
  const produce = (async () => {
    try {
      for (const file of job.files) {
        await file.blob.stream().pipeTo(
          tar.controller.add({
            name: file.name,
            size: file.blob.size,
            type: "file",
          }),
        );
        tracker.report(file.blob.size);
      }
      tar.controller.finalize();
    } catch (error) {
      tar.controller.error(error);
      throw error;
    }
  })();
  const consume = xzStream(tar.readable, false, job.preset).pipeTo(output);
  await Promise.all([produce, consume]);
}

async function decompressArchive(
  job: WorkerJob,
  output: WritableStream<Uint8Array>,
  tracker: ArchiveTracker,
): Promise<void> {
  if (!job.source) {
    throw new Error("Missing XZ source");
  }
  const zip = new ZipWriter(output, {
    level: 0,
    zip64: true,
    bufferedWrite: false,
    useWebWorkers: false,
  });
  const decoded = xzStream(job.source, true);
  const entries = decoded.pipeThrough(createTarDecoder({ strict: true })).getReader();
  try {
    for (;;) {
      const next = await entries.read();
      if (next.done) {
        break;
      }
      await addTarEntry(next.value.header, next.value.body, zip, tracker);
    }
    for (const file of job.files) {
      await addExtraFile(file, zip, tracker);
    }
    await zip.close();
  } finally {
    try {
      await entries.cancel();
    } catch {
      /* Preserve the archive error. */
    }
    entries.releaseLock();
  }
}

async function addTarEntry(
  header: TarHeader,
  body: ReadableStream<Uint8Array>,
  zip: ZipWriter<unknown>,
  tracker: ArchiveTracker,
): Promise<void> {
  try {
    tracker.register(header.name, header.size);
    if (header.type !== "file" && header.type !== "directory") {
      throw new Error(`Unsupported TAR entry type: ${String(header.type)}`);
    }
    await zip.add(header.name, body, { directory: header.type === "directory" });
    tracker.report();
  } catch (error) {
    try {
      await body.cancel(error);
    } catch {
      /* Preserve the archive error. */
    }
    throw error;
  }
}

async function addExtraFile(
  file: ArchiveFile,
  zip: ZipWriter<unknown>,
  tracker: ArchiveTracker,
): Promise<void> {
  tracker.register(file.name, file.blob.size);
  await zip.add(file.name, file.blob.stream());
  tracker.report();
}

export async function runArchive(
  job: WorkerJob,
  output: WritableStream<Uint8Array>,
  progress: (value: ArchiveProgress) => void,
): Promise<void> {
  validateJob(job);
  const tracker = new ArchiveTracker(job, progress);
  if (job.operation === "compress") {
    await compressArchive(job, output, tracker);
  } else {
    await decompressArchive(job, output, tracker);
  }
}
