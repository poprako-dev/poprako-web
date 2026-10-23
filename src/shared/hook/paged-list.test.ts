import { deferred } from "@/test-resource/deferred";
import { afterEach, expect, test, vi } from "vitest";
import type { Result } from "@/shared/utility/result";
import { PagedList, type PageLoader } from "./paged-list";

afterEach(() => vi.restoreAllMocks());

test("concurrent observers share one request and disposal cancels its transport", async () => {
  const pending = deferred<Result<string[]>>();
  const loader = vi.fn<PageLoader<string>>(() => pending.promise);
  const list = new PagedList(loader, 2);
  const dispose = list.start();
  await Promise.all([list.loadMore(), list.loadMore()]);
  expect(loader).toHaveBeenCalledOnce();
  const signal = loader.mock.calls[0]?.[2];
  expect(signal?.aborted).toBe(false);
  dispose();
  expect(signal?.aborted).toBe(true);
  pending.resolve({ success: true, data: ["obsolete"] });
  await pending.promise;
  expect(list.getSnapshot().items).toEqual([]);
});

test("a failed next page keeps items and retries the same offset without an automatic loop", async () => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  const loader = vi
    .fn<PageLoader<string>>()
    .mockResolvedValueOnce({ success: true, data: ["one", "two"] })
    .mockResolvedValueOnce({ success: false, error: "网络连接失败" })
    .mockResolvedValueOnce({ success: true, data: ["three"] });
  const list = new PagedList(loader, 2);
  const dispose = list.start();
  await vi.waitFor(() => {
    expect(list.getSnapshot().items).toHaveLength(2);
  });
  await list.loadMore();
  expect(list.getSnapshot()).toMatchObject({
    items: ["one", "two"],
    error: "网络连接失败",
    hasMore: true,
    isLoading: false,
  });
  await list.loadMore();
  expect(loader).toHaveBeenCalledTimes(2);
  await list.retry();
  expect(loader.mock.calls.map(([offset]) => offset)).toEqual([0, 2, 2]);
  expect(list.getSnapshot()).toEqual({
    items: ["one", "two", "three"],
    error: null,
    hasMore: false,
    isLoading: false,
  });
  await list.loadMore();
  expect(loader).toHaveBeenCalledTimes(3);
  dispose();
});

test("a late response from an aborted lifecycle cannot finish its replacement", async () => {
  const old = deferred<Result<string[]>>();
  const current = deferred<Result<string[]>>();
  const loader = vi
    .fn<PageLoader<string>>()
    .mockReturnValueOnce(old.promise)
    .mockReturnValueOnce(current.promise);
  const list = new PagedList(loader, 2);
  list.start()();
  const dispose = list.start();
  old.resolve({ success: true, data: ["obsolete"] });
  await old.promise;
  expect(list.getSnapshot().isLoading).toBe(true);
  current.resolve({ success: true, data: ["current"] });
  await current.promise;
  expect(list.getSnapshot().items).toEqual(["current"]);
  dispose();
});

test("a rejected initial request is retryable rather than an exhausted empty list", async () => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  const loader = vi
    .fn<PageLoader<string>>()
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValueOnce({ success: true, data: [] });
  const list = new PagedList(loader, 2);
  const dispose = list.start();
  await vi.waitFor(() => {
    expect(list.getSnapshot().error).toBe("offline");
  });
  expect(list.getSnapshot().hasMore).toBe(true);
  await list.retry();
  expect(loader.mock.calls.map(([offset]) => offset)).toEqual([0, 0]);
  expect(list.getSnapshot()).toEqual({
    items: [],
    isLoading: false,
    hasMore: false,
    error: null,
  });
  dispose();
});
