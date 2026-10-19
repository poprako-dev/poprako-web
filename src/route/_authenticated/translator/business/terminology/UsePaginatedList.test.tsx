import { act, renderHook } from "@testing-library/react";
import type { RenderHookResult } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import type { Mock } from "vitest";
import type { Result } from "@/shared/utility/result";
import { usePaginatedList } from "./use-paginated-list";

type Item = { id: string };
type PageLoader = (offset: number, limit: number) => Promise<Result<Item[]>>;
type ListHarness = RenderHookResult<
  ReturnType<typeof usePaginatedList<Item>>,
  { queryKey: string }
> & {
  discarded: ReturnType<typeof deferredPage>;
  current: ReturnType<typeof deferredPage>;
  loadPage: Mock<PageLoader>;
  onError: Mock;
};

function deferredPage(): {
  promise: Promise<Result<Item[]>>;
  resolve: (result: Result<Item[]>) => void;
} {
  let resolve: (result: Result<Item[]>) => void = () => undefined;
  const promise = new Promise<Result<Item[]>>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}

function renderList(): ListHarness {
  const discarded = deferredPage();
  const current = deferredPage();
  const loadPage = vi
    .fn<PageLoader>()
    .mockReturnValueOnce(discarded.promise)
    .mockReturnValue(current.promise);
  const onError = vi.fn();
  const view = renderHook(
    ({ queryKey }) => usePaginatedList({ enabled: true, queryKey, pageSize: 2, loadPage, onError }),
    { initialProps: { queryKey: "terms:base-1" }, reactStrictMode: true },
  );
  return { ...view, discarded, current, loadPage, onError };
}

test("uses the replayed request and ignores the discarded response", async () => {
  const { result, discarded, current, loadPage, onError } = renderList();
  expect(loadPage).toHaveBeenCalledTimes(2);
  await act(async () => {
    discarded.resolve({ success: true, data: [{ id: "discarded" }] });
    await discarded.promise;
  });
  expect(result.current.isInitialLoading).toBe(true);
  expect(result.current.items).toEqual([]);
  await act(async () => {
    current.resolve({ success: true, data: [{ id: "current" }] });
    await current.promise;
  });
  expect(result.current.isInitialLoading).toBe(false);
  expect(result.current.items).toEqual([{ id: "current" }]);
  expect(onError).not.toHaveBeenCalled();
});

test("leaves loading and reports a failed replayed request", async () => {
  const { result, current, onError } = renderList();
  const failure = { success: false, error: "术语加载失败" } as const;
  await act(async () => {
    current.resolve(failure);
    await current.promise;
  });
  expect(result.current.isInitialLoading).toBe(false);
  expect(result.current.error).toBe(failure.error);
  expect(onError).toHaveBeenCalledExactlyOnceWith(failure);
});

test("keeps the newer query result when the previous query finishes later", async () => {
  const { result, current, loadPage, rerender } = renderList();
  const next = deferredPage();
  loadPage.mockReturnValue(next.promise);
  rerender({ queryKey: "terms:base-2" });
  await act(async () => {
    next.resolve({ success: true, data: [{ id: "new-query" }] });
    await next.promise;
  });
  await act(async () => {
    current.resolve({ success: true, data: [{ id: "old-query" }] });
    await current.promise;
  });
  expect(result.current.isInitialLoading).toBe(false);
  expect(result.current.items).toEqual([{ id: "new-query" }]);
});

test("ignores a failed response after unmount", async () => {
  const { current, unmount, onError } = renderList();
  unmount();
  await act(async () => {
    current.resolve({ success: false, error: "已卸载" });
    await current.promise;
  });
  expect(onError).not.toHaveBeenCalled();
});
