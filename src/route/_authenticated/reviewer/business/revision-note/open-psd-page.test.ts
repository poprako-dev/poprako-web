import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { openPsdPage } from "./open-psd-page";
import type { PsdResponse } from "./psd-protocol";

const workers: FakeWorker[] = [];
class FakeWorker {
  onmessage: ((event: MessageEvent<PsdResponse>) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  postMessage = vi.fn();
  terminate = vi.fn();
  constructor() {
    workers.push(this);
  }
  complete(): void {
    this.onmessage?.(
      new MessageEvent<PsdResponse>("message", {
        data: {
          id: 1,
          type: "opened",
          width: 900,
          height: 1280,
          layers: [],
          image: new Blob(["final image"], { type: "image/png" }),
        },
      }),
    );
  }
}
function currentWorker(): FakeWorker {
  const worker = workers[0];
  if (!worker) throw new Error("Expected a decode worker");
  return worker;
}
beforeEach(() => {
  workers.length = 0;
  vi.stubGlobal("Worker", FakeWorker);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it("ends the decode worker immediately and keeps only the final image until disposal", async () => {
  const revoke = vi.spyOn(URL, "revokeObjectURL");
  const result = openPsdPage(new Blob(), new AbortController().signal);
  const worker = currentWorker();
  worker.complete();
  const page = await result;
  expect(worker.terminate).toHaveBeenCalledTimes(1);
  expect(worker.onmessage).toBeNull();
  expect(worker.onerror).toBeNull();
  expect(revoke).not.toHaveBeenCalled();
  expect(worker.postMessage).toHaveBeenCalledTimes(1);
  page.dispose();
  page.dispose();
  expect(revoke).toHaveBeenCalledExactlyOnceWith(page.composite.url);
  expect(worker.terminate).toHaveBeenCalledTimes(1);
});

it("cancels a pending decode and releases its worker", async () => {
  const controller = new AbortController();
  const result = openPsdPage(new Blob(), controller.signal);
  const rejected = expect(result).rejects.toMatchObject({ name: "AbortError" });
  controller.abort();
  await rejected;
  expect(currentWorker().terminate).toHaveBeenCalledTimes(1);
});

it("revokes the final image when the page is aborted after decoding", async () => {
  const revoke = vi.spyOn(URL, "revokeObjectURL");
  const controller = new AbortController();
  const result = openPsdPage(new Blob(), controller.signal);
  currentWorker().complete();
  const page = await result;
  controller.abort();
  expect(revoke).toHaveBeenCalledExactlyOnceWith(page.composite.url);
  expect(currentWorker().terminate).toHaveBeenCalledTimes(1);
});
