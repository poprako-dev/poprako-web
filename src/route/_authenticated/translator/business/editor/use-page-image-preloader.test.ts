import { describe, expect, test, vi } from "vitest";
import {
  centerOutPageIndexes,
  PageImagePreloader,
  resolveInitialPageIndex,
} from "@/route/_authenticated/translator/business/editor/use-page-image-preloader";

type Deferred = {
  promise: Promise<void>;
  resolve: () => void;
};

function deferred(): Deferred {
  let resolve = (): void => undefined;
  const promise = new Promise<void>((complete) => {
    resolve = complete;
  });

  return { promise, resolve };
}

async function flushTasks(turns = 20): Promise<void> {
  for (let turn = 0; turn < turns; turn++) await Promise.resolve();
}

describe("page image preload order", () => {
  test("expands from the current page and prefers the next page", () => {
    expect(centerOutPageIndexes(7, 3)).toEqual([3, 4, 2, 5, 1, 6, 0]);
    expect(centerOutPageIndexes(4, 0)).toEqual([0, 1, 2, 3]);
    expect(centerOutPageIndexes(4, 3)).toEqual([3, 2, 1, 0]);
  });

  test("resolves the initial page before preloading starts", () => {
    const pages = [{ id: "page-0" }, { id: "page-1" }, { id: "page-2" }];

    expect(resolveInitialPageIndex(pages, "page-2", 1)).toBe(2);
    expect(resolveInitialPageIndex(pages, "missing", 1)).toBe(1);
    expect(resolveInitialPageIndex(pages, undefined, 9)).toBe(0);
  });
});

describe("page image preloader", () => {
  test("loads every page in center-out order", async () => {
    const loadedUrls: string[] = [];
    const preloader = new PageImagePreloader({
      concurrency: 1,
      resolvePageImage: (pageId, quality) => Promise.resolve(`${pageId}-${quality}`),
      loadImage: (url) => {
        loadedUrls.push(url);
        return Promise.resolve();
      },
    });

    preloader.configure({
      pageIds: ["page-0", "page-1", "page-2", "page-3", "page-4"],
      centerIndex: 2,
      quality: "optimized",
    });
    await flushTasks();

    expect(loadedUrls).toEqual([
      "page-2-optimized",
      "page-3-optimized",
      "page-1-optimized",
      "page-4-optimized",
      "page-0-optimized",
    ]);
  });

  test("never exceeds four concurrent image loads", async () => {
    const pending: Deferred[] = [];
    let activeCount = 0;
    let maxActiveCount = 0;
    const preloader = new PageImagePreloader({
      resolvePageImage: (pageId) => Promise.resolve(pageId),
      loadImage: async () => {
        const task = deferred();
        pending.push(task);
        activeCount++;
        maxActiveCount = Math.max(maxActiveCount, activeCount);
        await task.promise;
        activeCount--;
      },
    });

    preloader.configure({
      pageIds: Array.from({ length: 8 }, (_, index) => `page-${String(index)}`),
      centerIndex: 4,
      quality: "optimized",
    });
    await flushTasks();

    expect(pending).toHaveLength(4);
    expect(maxActiveCount).toBe(4);

    const firstPending = pending[0];
    if (!firstPending) throw new Error("预加载任务缺失");
    firstPending.resolve();
    await flushTasks();

    expect(pending).toHaveLength(5);
    expect(maxActiveCount).toBe(4);

    preloader.stop();
    for (const task of pending) task.resolve();
    await flushTasks();
  });

  test("reprioritizes waiting jobs when page or quality changes", async () => {
    const firstLoad = deferred();
    const loadedUrls: string[] = [];
    const preloader = new PageImagePreloader({
      concurrency: 1,
      resolvePageImage: (pageId, quality) => Promise.resolve(`${pageId}-${quality}`),
      loadImage: async (url) => {
        loadedUrls.push(url);
        if (loadedUrls.length === 1) await firstLoad.promise;
      },
    });

    preloader.configure({
      pageIds: ["page-0", "page-1", "page-2"],
      centerIndex: 0,
      quality: "optimized",
    });
    await flushTasks();
    preloader.configure({
      pageIds: ["page-0", "page-1", "page-2"],
      centerIndex: 2,
      quality: "original",
    });
    firstLoad.resolve();
    await flushTasks();

    expect(loadedUrls.slice(0, 2)).toEqual(["page-0-optimized", "page-2-original"]);

    preloader.configure({
      pageIds: ["page-0", "page-1", "page-2"],
      centerIndex: 2,
      quality: "optimized",
    });
    await flushTasks();

    expect(loadedUrls).toContain("page-2-optimized");
    expect(loadedUrls.filter((url) => url === "page-0-optimized")).toHaveLength(1);
  });

  test("triggers the same final URL only once", async () => {
    const loadImage = vi.fn(() => Promise.resolve());
    const preloader = new PageImagePreloader({
      concurrency: 2,
      resolvePageImage: () => Promise.resolve("shared-url"),
      loadImage,
    });

    preloader.configure({
      pageIds: ["page-0", "page-1"],
      centerIndex: 0,
      quality: "optimized",
    });
    await flushTasks();

    expect(loadImage).toHaveBeenCalledTimes(1);
  });

  test("continues after failures and stops dispatching after teardown", async () => {
    const heldLoad = deferred();
    const loadImage = vi
      .fn()
      .mockRejectedValueOnce(new Error("broken"))
      .mockImplementationOnce(async () => heldLoad.promise);
    const onError = vi.fn();
    const preloader = new PageImagePreloader({
      concurrency: 1,
      resolvePageImage: (pageId) => Promise.resolve(pageId),
      loadImage,
      onError,
    });

    preloader.configure({
      pageIds: ["page-0", "page-1", "page-2"],
      centerIndex: 0,
      quality: "optimized",
    });
    await flushTasks();

    expect(onError).toHaveBeenCalledTimes(1);
    expect(loadImage).toHaveBeenCalledTimes(2);

    preloader.stop();
    heldLoad.resolve();
    await flushTasks();

    expect(loadImage).toHaveBeenCalledTimes(2);
  });

  test("resumes when StrictMode replays effect setup after cleanup", async () => {
    const loadImage = vi.fn(() => Promise.resolve());
    const preloader = new PageImagePreloader({
      resolvePageImage: (pageId) => Promise.resolve(pageId),
      loadImage,
    });

    preloader.stop();
    preloader.configure({
      pageIds: ["page-0"],
      centerIndex: 0,
      quality: "optimized",
    });
    await flushTasks();

    expect(loadImage).toHaveBeenCalledWith("page-0");
  });
});
