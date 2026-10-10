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

class ArchiveSession {
  private worker: Worker | undefined;
  private isFinished = false;
  private pendingPull: (() => void) | undefined;
  private readonly inputAbort = new AbortController();
  private readonly job: WorkerJob;
  private readonly options: ArchiveOptions;
  private readonly controller: ReadableStreamDefaultController<Uint8Array>;

  constructor(
    job: WorkerJob,
    options: ArchiveOptions,
    controller: ReadableStreamDefaultController<Uint8Array>,
  ) {
    this.job = job;
    this.options = options;
    this.controller = controller;
  }

  cleanup(): void {
    this.isFinished = true;
    this.worker?.terminate();
    this.options.signal?.removeEventListener("abort", this.abort);
    this.inputAbort.abort();
    this.pendingPull?.();
  }

  private fail(reason: unknown): void {
    if (this.isFinished) {
      return;
    }
    this.controller.error(reason);
    this.cleanup();
  }

  private readonly abort = (): void => {
    this.fail(this.options.signal?.reason ?? new DOMException("Archive cancelled", "AbortError"));
  };

  start(): void {
    if (this.options.signal?.aborted) {
      void this.job.source?.cancel(this.options.signal.reason).catch(() => {
        /* Already errored. */
      });
      this.abort();
      return;
    }
    this.options.signal?.addEventListener("abort", this.abort, { once: true });
    try {
      this.worker = new Worker(new URL("./compress/archive-worker.ts", import.meta.url), {
        type: "module",
      });
      this.listen(this.worker);
      // Keep an abortable bridge on the caller's side: Worker termination alone
      // does not reliably cancel a transferred fetch stream.
      if (this.job.source) {
        this.job.source = this.job.source.pipeThrough(
          new TransformStream<Uint8Array, Uint8Array>(),
          {
            signal: this.inputAbort.signal,
          },
        );
      }
      this.worker.postMessage(this.job, this.job.source ? [this.job.source] : []);
    } catch (error) {
      void this.job.source?.cancel(error).catch(() => {
        /* Bridge may already own the source. */
      });
      this.fail(error);
    }
  }

  private listen(worker: Worker): void {
    worker.addEventListener("error", (event) => {
      this.fail(new Error(event.message));
    });
    worker.addEventListener("messageerror", () => {
      this.fail(new Error("Archive worker IPC error"));
    });
    worker.addEventListener("message", (event: MessageEvent<WorkerReply>) => {
      this.receive(event.data);
    });
  }

  private receive(message: WorkerReply): void {
    if (this.isFinished) {
      return;
    }
    switch (message.type) {
      case "chunk": {
        this.controller.enqueue(message.chunk);
        this.pendingPull?.();
        this.pendingPull = undefined;
        break;
      }
      case "progress": {
        try {
          this.options.onProgress?.(message.progress);
        } catch (error) {
          this.fail(error);
        }
        break;
      }
      case "error": {
        this.fail(new Error(message.message));
        break;
      }
      case "done": {
        this.controller.close();
        this.cleanup();
      }
    }
  }

  pull(): Promise<void> | undefined {
    if (this.isFinished) {
      return;
    }
    return new Promise<void>((resolve) => {
      this.pendingPull = resolve;
      this.worker?.postMessage("pull");
    });
  }
}

function startArchive(job: WorkerJob, options: ArchiveOptions): ReadableStream<Uint8Array> {
  let session: ArchiveSession;
  return new ReadableStream<Uint8Array>(
    {
      start(controller) {
        session = new ArchiveSession(job, options, controller);
        session.start();
      },
      pull() {
        return session.pull();
      },
      cancel() {
        session.cleanup();
      },
    },
    { highWaterMark: 0 },
  );
}
