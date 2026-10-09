import type { RevisionPage } from "./revision-page";
import type { PsdRequest, PsdResponse } from "./psd-protocol";
import { waitForCanvasRelease } from "./wait-for-canvas-release";
export async function openPsdPage(file: Blob, signal: AbortSignal): Promise<RevisionPage> {
  signal.throwIfAborted();
  const worker = new Worker(new URL("./psd-worker.ts", import.meta.url), { type: "module" });
  let stopped = false;
  let disposed = false;
  let released = Promise.resolve();
  let canvas: HTMLCanvasElement | null = null;
  let image: ImageBitmap | null = null;
  let rejectPending: ((error: Error) => void) | null = null;
  function stopWorker(): void {
    if (stopped) return;
    stopped = true;
    worker.onmessage = null;
    worker.onerror = null;
    worker.terminate();
  }
  function abort(): void {
    void dispose();
  }
  function dispose(): Promise<void> {
    if (disposed) return released;
    disposed = true;
    signal.removeEventListener("abort", abort);
    stopWorker();
    rejectPending?.(new DOMException("PSD page closed", "AbortError"));
    rejectPending = null;
    image?.close();
    image = null;
    if (canvas) {
      canvas.width = 0;
      canvas.height = 0;
      released = waitForCanvasRelease(canvas);
      canvas = null;
    }
    return released;
  }
  signal.addEventListener("abort", abort, { once: true });
  try {
    const opened = await new Promise<PsdResponse>((resolve, reject) => {
      rejectPending = reject;
      worker.onmessage = (event: MessageEvent<PsdResponse>): void => {
        if (event.data.type === "error") reject(new Error(event.data.message));
        else {
          image = event.data.image;
          resolve(event.data);
        }
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
    // Termination is asynchronous. Yield before allocating the display surface so
    // the decode thread can release its input and intermediate pixel buffers.
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    signal.throwIfAborted();
    canvas = document.createElement("canvas");
    canvas.width = opened.width;
    canvas.height = opened.height;
    // Prefer an accelerated display surface. The browser can fall back to software.
    const context = canvas.getContext("2d", { willReadFrequently: false });
    if (!context) throw new Error("无法创建 PSD 预览画布");
    context.drawImage(opened.image, 0, 0);
    opened.image.close();
    image = null;
    return {
      width: opened.width,
      height: opened.height,
      layers: opened.layers,
      composite: { source: canvas, bounds: { xCoord: 0, yCoord: 0, width: 1, height: 1 } },
      dispose,
    };
  } catch (error) {
    await dispose();
    throw error;
  }
}
