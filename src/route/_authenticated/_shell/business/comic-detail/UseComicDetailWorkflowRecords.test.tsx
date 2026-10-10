import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import type { ChapterWorkflowRecord } from "@/route/_authenticated/business/chapter/chapter-workflow-record";
import type { DetailContract } from "./comic-detail-type";
import type { Result } from "@/shared/utility/result";
import { useComicDetailWorkflowRecords } from "./use-comic-detail-workflow-records";

function records(prefix: string, count: number): ChapterWorkflowRecord[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `${prefix}-${String(index)}`,
    chapterId: "chapter-a",
    actorUserId: null,
    event: { kind: "chapter_created" },
    createdAt: index,
  }));
}

function pendingPage(): {
  promise: Promise<Result<ChapterWorkflowRecord[]>>;
  resolve: (value: Result<ChapterWorkflowRecord[]>) => void;
} {
  let resolve: (value: Result<ChapterWorkflowRecord[]>) => void = () => {
    throw new Error("Deferred page not initialized");
  };
  const promise = new Promise<Result<ChapterWorkflowRecord[]>>((accept) => {
    resolve = accept;
  });
  return { promise, resolve };
}

afterEach(cleanup);

test("workflow record cache retains chapter state while its panel is disabled", async () => {
  const load = vi.fn<DetailContract["onLoadWorkflowRecords"]>(() =>
    Promise.resolve({ success: true, data: records("head", 1) }),
  );
  const view = renderHook(
    ({ enabled }) =>
      useComicDetailWorkflowRecords({
        chapterId: "chapter-a",
        enabled,
        onLoadWorkflowRecords: load,
      }),
    { initialProps: { enabled: true } },
  );
  await waitFor(() => {
    expect(view.result.current.state.loadedOnce).toBe(true);
  });
  expect(load).toHaveBeenCalledTimes(1);
  view.rerender({ enabled: false });
  await act(async () => {
    await view.result.current.refreshLatest();
  });
  expect(load).toHaveBeenCalledTimes(1);
  expect(view.result.current.state.records).toEqual(records("head", 1));
  view.rerender({ enabled: true });
  await waitFor(() => {
    expect(load).toHaveBeenCalledTimes(2);
  });
  expect(view.result.current.state.records).toEqual(records("head", 1));
});

test("workflow head refresh invalidates an older pagination response", async () => {
  const older = pendingPage();
  const refreshed = pendingPage();
  const load = vi
    .fn<DetailContract["onLoadWorkflowRecords"]>()
    .mockResolvedValueOnce({ success: true, data: records("initial", 21) })
    .mockReturnValueOnce(older.promise)
    .mockReturnValueOnce(refreshed.promise);
  const view = renderHook(() =>
    useComicDetailWorkflowRecords({
      chapterId: "chapter-a",
      enabled: true,
      onLoadWorkflowRecords: load,
    }),
  );
  await waitFor(() => {
    expect(view.result.current.state.hasMore).toBe(true);
  });
  let pagination: Promise<void> = Promise.resolve();
  let refresh: Promise<void> = Promise.resolve();
  act(() => {
    pagination = view.result.current.loadMore();
  });
  act(() => {
    refresh = view.result.current.refreshLatest();
  });
  await act(async () => {
    refreshed.resolve({ success: true, data: records("refreshed", 1) });
    await refresh;
  });
  await act(async () => {
    older.resolve({ success: true, data: records("stale", 21) });
    await pagination;
  });
  expect(view.result.current.state.records.map((record) => record.id)).toEqual([
    "refreshed-0",
    ...records("initial", 20).map((record) => record.id),
  ]);
  expect(view.result.current.state.isLoadingMore).toBe(false);
});

test("workflow refresh coalesces repeated requests for the same chapter", async () => {
  const response = pendingPage();
  const load = vi.fn(() => response.promise);
  const view = renderHook(() =>
    useComicDetailWorkflowRecords({
      chapterId: "chapter-a",
      enabled: true,
      onLoadWorkflowRecords: load,
    }),
  );
  await act(async () => {
    await view.result.current.refreshLatest();
    await view.result.current.loadMore();
  });
  expect(load).toHaveBeenCalledTimes(1);
  act(() => {
    response.resolve({ success: true, data: records("head", 1) });
  });
  await waitFor(() => {
    expect(view.result.current.state.records).toEqual(records("head", 1));
    expect(view.result.current.state.isLoading).toBe(false);
  });
});
