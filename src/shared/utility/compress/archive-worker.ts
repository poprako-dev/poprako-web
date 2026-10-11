import { runArchive } from "@/shared/utility/compress/core";
import type { WorkerJob, WorkerReply } from "@/shared/utility/compress/types";

const state: { resume?: () => void; hasDemand: boolean; isStarted: boolean } = {
  hasDemand: false,
  isStarted: false,
};

function reply(message: WorkerReply, transfer: Transferable[] = []): void {
  postMessage(message, { transfer });
}

async function run(job: WorkerJob): Promise<void> {
  try {
    const output = new WritableStream<Uint8Array>({
      async write(chunk) {
        if (!state.hasDemand) {
          await new Promise<void>((resolve) => {
            state.resume = resolve;
          });
        }
        state.hasDemand = false;
        // zip.js may retain its buffers; transfer a dedicated copy only.
        const copy = new Uint8Array(chunk);
        reply({ type: "chunk", chunk: copy }, [copy.buffer]);
      },
      close() {
        reply({ type: "done" });
      },
    });
    await runArchive(job, output, (progress) => {
      reply({ type: "progress", progress });
    });
  } catch (error) {
    reply({ type: "error", message: error instanceof Error ? error.message : String(error) });
  }
}

addEventListener("message", (event: MessageEvent<WorkerJob | "pull">) => {
  if (event.data === "pull") {
    state.hasDemand = true;
    state.resume?.();
    delete state.resume;
  } else if (!state.isStarted) {
    state.isStarted = true;
    void run(event.data);
  }
});
