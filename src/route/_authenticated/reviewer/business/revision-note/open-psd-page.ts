import type { RevisionPage } from "./revision-page";
import type { PsdRequest, PsdResponse } from "./psd-protocol";
export async function openPsdPage(file: Blob, signal: AbortSignal): Promise<RevisionPage> {
  signal.throwIfAborted();
  const worker = new Worker(new URL("./psd-worker.ts", import.meta.url), { type: "module" });
  let stopped = false;
  let disposed = false;
  let compositeUrl: string | null = null;
  let rejectPending: ((error: Error) => void) | null = null;
  function stopWorker(): void {
    if (stopped) return;
    stopped = true;
    worker.onmessage = null;
    worker.onerror = null;
    worker.terminate();
  }
  function dispose(): void {
    if (disposed) return;
    disposed = true;
    signal.removeEventListener("abort", dispose);
    stopWorker();
    rejectPending?.(new DOMException("PSD page closed", "AbortError"));
    rejectPending = null;
    if (compositeUrl) URL.revokeObjectURL(compositeUrl);
  }
  signal.addEventListener("abort", dispose, { once: true });
  try {
    const opened = await new Promise<PsdResponse>((resolve, reject) => {
      rejectPending = reject;
      worker.onmessage = (event: MessageEvent<PsdResponse>): void => {
        if (event.data.type === "error") reject(new Error(event.data.message));
        else resolve(event.data);
      };
      worker.onerror = (event): void => {
        reject(new Error(event.message || "PSD worker failed"));
      };
      worker.postMessage({ id: 1, type: "open", file } satisfies PsdRequest);
    });
    rejectPending = null;
    signal.throwIfAborted();
    if (opened.type !== "opened") throw new Error("PSD worker returned an invalid page");
    stopWorker();
    compositeUrl = URL.createObjectURL(opened.image);
    return {
      width: opened.width,
      height: opened.height,
      layers: opened.layers,
      composite: { url: compositeUrl, bounds: { xCoord: 0, yCoord: 0, width: 1, height: 1 } },
      dispose,
    };
  } catch (error) {
    dispose();
    throw error;
  }
}
