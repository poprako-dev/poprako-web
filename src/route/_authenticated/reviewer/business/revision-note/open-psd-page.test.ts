import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { openPsdPage } from "./open-psd-page";
import type { PsdResponse } from "./psd-protocol";

const workers: FakeWorker[] = [];
const drawImage = vi.fn();
const bitmap = { close: vi.fn() };
const surface = {
  width: 0,
  height: 0,
  getContext: vi.fn<() => { drawImage: typeof drawImage } | null>(() => ({ drawImage })),
};
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
          width: 1,
          height: 1,
          layers: [],
          image: bitmap as unknown as ImageBitmap,
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
  drawImage.mockReset();
  surface.getContext.mockReset().mockReturnValue({ drawImage });
  vi.stubGlobal("Worker", FakeWorker);
  vi.stubGlobal("document", { createElement: vi.fn(() => surface) });
  bitmap.close.mockClear();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it("terminates decoding before painting directly, and clears the owned canvas on disposal", async () => {
  const createUrl = vi.spyOn(URL, "createObjectURL");
  const result = openPsdPage(new Blob(), new AbortController().signal);
  const worker = currentWorker();
  drawImage.mockImplementation(() => {
    expect(worker.terminate).toHaveBeenCalledTimes(1);
  });
  worker.complete();
  const page = await result;
  expect(worker.onmessage).toBeNull();
  expect(worker.onerror).toBeNull();
  expect(worker.postMessage).toHaveBeenCalledTimes(1);
  expect(createUrl).not.toHaveBeenCalled();
  expect(page.composite.source).toBe(surface);
  expect(surface.getContext).toHaveBeenCalledExactlyOnceWith("2d", { willReadFrequently: false });
  expect(drawImage).toHaveBeenCalledExactlyOnceWith(bitmap, 0, 0);
  expect(bitmap.close).toHaveBeenCalledTimes(1);
  await page.dispose();
  await page.dispose();
  expect(drawImage).toHaveBeenCalledTimes(1);
  expect(surface.width).toBe(0);
  expect(surface.height).toBe(0);
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

it("clears the final canvas when the page is aborted after decoding", async () => {
  const controller = new AbortController();
  const result = openPsdPage(new Blob(), controller.signal);
  currentWorker().complete();
  await result;
  controller.abort();
  expect(surface.width).toBe(0);
  expect(surface.height).toBe(0);
  expect(currentWorker().terminate).toHaveBeenCalledTimes(1);
});

it("releases the worker and canvas if painting fails", async () => {
  drawImage.mockImplementation(() => {
    throw new Error("Canvas allocation failed");
  });
  const result = openPsdPage(new Blob(), new AbortController().signal);
  currentWorker().complete();
  await expect(result).rejects.toThrow("Canvas allocation failed");
  expect(bitmap.close).toHaveBeenCalledTimes(1);
  expect(currentWorker().terminate).toHaveBeenCalledTimes(1);
  expect(surface.width).toBe(0);
  expect(surface.height).toBe(0);
});

it("does not paint a decode that is aborted before its result is consumed", async () => {
  const controller = new AbortController();
  const result = openPsdPage(new Blob(), controller.signal);
  currentWorker().complete();
  controller.abort();
  await expect(result).rejects.toMatchObject({ name: "AbortError" });
  expect(drawImage).not.toHaveBeenCalled();
  expect(bitmap.close).toHaveBeenCalledTimes(1);
  expect(currentWorker().terminate).toHaveBeenCalledTimes(1);
});

it("releases the transferred image if no display context can be created", async () => {
  surface.getContext.mockReturnValueOnce(null);
  const result = openPsdPage(new Blob(), new AbortController().signal);
  currentWorker().complete();
  await expect(result).rejects.toThrow("无法创建 PSD 预览画布");
  expect(drawImage).not.toHaveBeenCalled();
  expect(bitmap.close).toHaveBeenCalledTimes(1);
  expect(currentWorker().terminate).toHaveBeenCalledTimes(1);
  expect(surface.width).toBe(0);
  expect(surface.height).toBe(0);
});
