import { createTarDecoder, createTarPacker } from "modern-tar";
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

export async function runArchive(
  job: WorkerJob,
  output: WritableStream<Uint8Array>,
  progress: (value: ArchiveProgress) => void,
): Promise<void> {
  validateJob(job);
  const seen = new Set<string>();
  let processedBytes = 0;
  let completedFiles = 0;
  function register(name: string, size: number): void {
    validateName(name);
    const key = name.replace(/\/$/u, "").normalize("NFC").toLowerCase();
    if (seen.has(key)) {
      throw new Error(`Duplicate archive path: ${name}`);
    }
    seen.add(key);
    processedBytes += size;
    if (!Number.isSafeInteger(size) || size < 0 || processedBytes > job.maxBytes) {
      throw new Error("Archive exceeds the uncompressed byte limit");
    }
    if (seen.size > job.maxFiles) {
      throw new Error("Archive exceeds the entry limit");
    }
  }
  function report(): void {
    completedFiles++;
    progress({ processedBytes, completedFiles });
  }
  if (job.operation === "compress") {
    for (const file of job.files) {
      if (file.name.endsWith("/")) {
        throw new Error("A file path cannot end with a slash");
      }
      register(file.name, file.blob.size);
    }
    processedBytes = 0;
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
          processedBytes += file.blob.size;
          report();
        }
        tar.controller.finalize();
      } catch (error) {
        tar.controller.error(error);
        throw error;
      }
    })();
    const consume = xzStream(tar.readable, false, job.preset).pipeTo(output);
    await Promise.all([produce, consume]);
    return;
  }
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
      const { header, body } = next.value;
      try {
        register(header.name, header.size);
        if (header.type !== "file" && header.type !== "directory") {
          throw new Error(`Unsupported TAR entry type: ${String(header.type)}`);
        }
        await zip.add(header.name, body, { directory: header.type === "directory" });
        report();
      } catch (error) {
        try {
          await body.cancel(error);
        } catch {
          /* Preserve the archive error. */
        }
        throw error;
      }
    }
    for (const file of job.files) {
      await addExtra(file);
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
  async function addExtra(file: ArchiveFile): Promise<void> {
    register(file.name, file.blob.size);
    await zip.add(file.name, file.blob.stream());
    report();
  }
}
