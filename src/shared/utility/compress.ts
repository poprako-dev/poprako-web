import type {
  ArchiveFile,
  ArchiveOptions,
  WorkerJob,
  WorkerReply,
  ZipOptions,
} from "@/shared/utility/compress/types";

export type {
  ArchiveFile,
  ArchiveOptions,
  ArchiveProgress,
  ZipOptions,
} from "@/shared/utility/compress/types";

/**
 * Streams a single .tar.xz in a dedicated Worker. Pipe to a file/OPFS writable
 * or a bounded multipart uploader; collecting a Blob buffers the whole result.
 * Output cancellation, signal abort and errors terminate the Worker/WASM heap.
 */
export function compressTarXz(
  files: readonly ArchiveFile[],
  options: ArchiveOptions = {},
): ReadableStream<Uint8Array> {
  return startArchive({ ...jobOptions(options), operation: "compress", files }, options);
}

/**
 * Streams a single ZIP64 (STORE) containing the extracted files and extraFiles.
 * Does not buffer PSDs or close successfully until XZ integrity checks complete.
 * Accepts this tool's single-stream XZ archives containing regular TAR files/directories.
 */
export function decompressTarXzToZip(
  source: Blob | ReadableStream<Uint8Array>,
  options: ZipOptions = {},
): ReadableStream<Uint8Array> {
  return startArchive(
    {
      ...jobOptions(options),
      operation: "decompress",
      files: options.extraFiles ?? [],
      source: source instanceof Blob ? source.stream() : source,
    },
    options,
  );
}

function jobOptions(options: ArchiveOptions): Pick<WorkerJob, "preset" | "maxBytes" | "maxFiles"> {
  return {
    preset: options.preset ?? 3,
    maxBytes: options.maxBytes ?? 8 * 1024 ** 3,
    maxFiles: options.maxFiles ?? 1000,
  };
}

function startArchive(job: WorkerJob, options: ArchiveOptions): ReadableStream<Uint8Array> {
  let worker: Worker | undefined;
  let isFinished = false;
  let pendingPull: (() => void) | undefined;
  const inputAbort = new AbortController();
  function cleanup(): void {
    isFinished = true;
    worker?.terminate();
    options.signal?.removeEventListener("abort", abort);
    inputAbort.abort();
    pendingPull?.();
  }
  let fail: (reason: unknown) => void;
  function abort(): void {
    fail(options.signal?.reason ?? new DOMException("Archive cancelled", "AbortError"));
  }
  return new ReadableStream<Uint8Array>(
    {
      start(controller) {
        fail = (reason) => {
          if (isFinished) {
            return;
          }
          controller.error(reason);
          cleanup();
        };
        if (options.signal?.aborted) {
          void job.source?.cancel(options.signal.reason).catch(() => {
            /* Already errored. */
          });
          abort();
          return;
        }
        options.signal?.addEventListener("abort", abort, { once: true });
        try {
          worker = new Worker(new URL("./compress/archive-worker.ts", import.meta.url), {
            type: "module",
          });
          worker.addEventListener("error", (event) => {
            fail(new Error(event.message));
          });
          worker.addEventListener("messageerror", () => {
            fail(new Error("Archive worker IPC error"));
          });
          worker.addEventListener("message", (event: MessageEvent<WorkerReply>) => {
            if (isFinished) {
              return;
            }
            const message = event.data;
            switch (message.type) {
              case "chunk": {
                controller.enqueue(message.chunk);
                pendingPull?.();
                pendingPull = undefined;
                break;
              }
              case "progress": {
                try {
                  options.onProgress?.(message.progress);
                } catch (error) {
                  fail(error);
                }
                break;
              }
              case "error": {
                fail(new Error(message.message));
                break;
              }
              case "done": {
                controller.close();
                cleanup();
              }
            }
          });
          // Keep an abortable bridge on the caller's side: Worker termination alone
          // does not reliably cancel a transferred fetch stream.
          if (job.source) {
            job.source = job.source.pipeThrough(new TransformStream<Uint8Array, Uint8Array>(), {
              signal: inputAbort.signal,
            });
          }
          worker.postMessage(job, job.source ? [job.source] : []);
        } catch (error) {
          void job.source?.cancel(error).catch(() => {
            /* Bridge may already own the source. */
          });
          fail(error);
        }
      },
      pull() {
        if (isFinished) {
          return;
        }
        return new Promise<void>((resolve) => {
          pendingPull = resolve;
          worker?.postMessage("pull");
        });
      },
      cancel() {
        cleanup();
      },
    },
    { highWaterMark: 0 },
  );
}
