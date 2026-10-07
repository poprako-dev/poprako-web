import type { RevisionPage } from "./revision-page";
import type { PsdRequest, PsdResponse } from "./psd-protocol";
interface Pending {
  resolve: (value: PsdResponse) => void;
  reject: (error: Error) => void;
  cleanup: () => void;
}
export async function openPsdPage(file: Blob, signal: AbortSignal): Promise<RevisionPage> {
  signal.throwIfAborted();
  const worker = new Worker(new URL("./psd-worker.ts", import.meta.url), { type: "module" });
  const pending = new Map<number, Pending>();
  let sequence = 0;
  let disposed = false;
  let compositeUrl: string | null = null;
  let layerUrl: string | null = null;
  function dispose(): void {
    if (disposed) return;
    disposed = true;
    signal.removeEventListener("abort", dispose);
    worker.terminate();
    for (const item of pending.values()) {
      item.cleanup();
      item.reject(new DOMException("PSD page closed", "AbortError"));
    }
    pending.clear();
    if (compositeUrl) URL.revokeObjectURL(compositeUrl);
    if (layerUrl) URL.revokeObjectURL(layerUrl);
  }
  signal.addEventListener("abort", dispose, { once: true });
  worker.onmessage = (event: MessageEvent<PsdResponse>): void => {
    const response = event.data;
    const item = pending.get(response.id);
    if (!item) return;
    pending.delete(response.id);
    item.cleanup();
    if (response.type === "error") item.reject(new Error(response.message));
    else item.resolve(response);
  };
  worker.onerror = (event): void => {
    for (const item of pending.values()) {
      item.cleanup();
      item.reject(new Error(event.message || "PSD worker failed"));
    }
    pending.clear();
    dispose();
  };
  function request(message: PsdRequest, requestSignal: AbortSignal): Promise<PsdResponse> {
    if (disposed) return Promise.reject(new Error("PSD 页面已关闭"));
    requestSignal.throwIfAborted();
    return new Promise((resolve, reject) => {
      function abort(): void {
        pending.delete(message.id);
        reject(new DOMException("PSD request cancelled", "AbortError"));
      }
      requestSignal.addEventListener("abort", abort, { once: true });
      pending.set(message.id, {
        resolve,
        reject,
        cleanup: () => {
          requestSignal.removeEventListener("abort", abort);
        },
      });
      worker.postMessage(message);
    });
  }
  try {
    const opened = await request({ id: ++sequence, type: "open", file }, signal);
    if (opened.type !== "opened") throw new Error("PSD worker returned an invalid page");
    compositeUrl = URL.createObjectURL(opened.image);
    return {
      width: opened.width,
      height: opened.height,
      layers: opened.layers,
      composite: { url: compositeUrl, bounds: { xCoord: 0, yCoord: 0, width: 1, height: 1 } },
      async renderLayer(layerId, requestSignal) {
        const response = await request({ id: ++sequence, type: "render", layerId }, requestSignal);
        requestSignal.throwIfAborted();
        if (response.type !== "rendered") throw new Error("PSD worker returned an invalid layer");
        if (layerUrl) URL.revokeObjectURL(layerUrl);
        layerUrl = URL.createObjectURL(response.image);
        return { url: layerUrl, bounds: response.bounds };
      },
      dispose,
    };
  } catch (error) {
    dispose();
    throw error;
  }
}
