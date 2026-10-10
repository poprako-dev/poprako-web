import type { CompositeStage, CompositeResult, CompositeMessage } from "./composite-contract";
export type { CompositeStage, CompositeResult } from "./composite-contract";
export function prepareComposite(
  file: File,
  signal: AbortSignal,
  report: (stage: CompositeStage) => void,
): Promise<CompositeResult> {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./composite-worker.ts", import.meta.url), {
      type: "module",
    });
    function cleanup(): void {
      signal.removeEventListener("abort", abort);
      worker.terminate();
    }
    function abort(): void {
      cleanup();
      reject(new DOMException("已取消", "AbortError"));
    }
    signal.addEventListener("abort", abort, { once: true });
    worker.onmessage = (event: MessageEvent<CompositeMessage>): void => {
      if ("stage" in event.data) {
        report(event.data.stage);
        return;
      }
      cleanup();
      if ("error" in event.data) reject(new Error(event.data.error));
      else resolve(event.data.result);
    };
    worker.onerror = (): void => {
      cleanup();
      reject(new Error("PSD 处理失败，请检查文件后重试"));
    };
    worker.onmessageerror = (): void => {
      cleanup();
      reject(new Error("无法读取 PSD 处理结果"));
    };
    try {
      worker.postMessage(file);
    } catch (error) {
      cleanup();
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });
}
