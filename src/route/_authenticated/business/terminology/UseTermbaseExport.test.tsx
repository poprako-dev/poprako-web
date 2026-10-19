import { act, renderHook } from "@testing-library/react";
import type { RenderHookResult } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import { useTermbaseExport } from "./use-termbase-export";
import type { TermbaseExportActions } from "./use-termbase-export";
import type { DeferredExport, ExportDataSource } from "./termbase-export-test-fixture";
import { downloadTermbase } from "./termbase-download";
import {
  createExportDataSource,
  deferredExport,
  exportContent,
} from "./termbase-export-test-fixture";

vi.mock("./termbase-download", () => ({ downloadTermbase: vi.fn() }));

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  useToastStore.setState({ showToast: vi.fn() });
});

type ExportHarness = RenderHookResult<TermbaseExportActions, { projectId: string }> & {
  dataSource: ExportDataSource;
  pending: DeferredExport;
  toast: ReturnType<typeof useToastStore.getState>["showToast"];
};

function renderExport(): ExportHarness {
  const dataSource = createExportDataSource();
  const pending = deferredExport();
  dataSource.exportTermbase.mockReturnValue(pending.promise);
  const view = renderHook(({ projectId }) => useTermbaseExport(dataSource, projectId), {
    initialProps: { projectId: "project-1" },
    reactStrictMode: true,
  });
  return { ...view, dataSource, pending, toast: useToastStore.getState().showToast };
}

test("deduplicates concurrent clicks per ID and allows independent libraries", async () => {
  const { result, dataSource, pending, toast } = renderExport();
  let tasks: Promise<void>[] = [];
  act(() => {
    tasks = [
      result.current.exportTermbase("one"),
      result.current.exportTermbase("one"),
      result.current.exportTermbase("two"),
    ];
  });
  expect(dataSource.exportTermbase).toHaveBeenCalledTimes(2);
  expect(result.current.exportingIds).toEqual(new Set(["one", "two"]));
  await act(async () => {
    pending.resolve({ success: true, data: exportContent });
    await Promise.all(tasks);
  });
  expect(downloadTermbase).toHaveBeenCalledTimes(2);
  expect(downloadTermbase).toHaveBeenCalledWith(exportContent);
  expect(toast).toHaveBeenCalledWith("已开始下载", "success");
  expect(result.current.exportingIds.size).toBe(0);
});

test.each([403, 422])(
  "does not download an HTTP failure and allows retry (%i)",
  async (httpStatus) => {
    const { result, dataSource, toast } = renderExport();
    dataSource.exportTermbase.mockResolvedValueOnce({
      success: false,
      error: "导出不可用",
      httpStatus,
    });
    await act(() => result.current.exportTermbase("one"));
    expect(downloadTermbase).not.toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith("导出不可用", "error");
    expect(result.current.exportingIds.size).toBe(0);
    dataSource.exportTermbase.mockResolvedValueOnce({ success: true, data: exportContent });
    await act(() => result.current.exportTermbase("one"));
    expect(downloadTermbase).toHaveBeenCalledExactlyOnceWith(exportContent);
  },
);

test("recovers from a thrown request or download error", async () => {
  const { result, dataSource, toast } = renderExport();
  dataSource.exportTermbase.mockRejectedValueOnce(new Error("offline"));
  await act(() => result.current.exportTermbase("one"));
  expect(downloadTermbase).not.toHaveBeenCalled();
  expect(toast).toHaveBeenCalledWith("offline", "error");
  expect(result.current.exportingIds.size).toBe(0);
  dataSource.exportTermbase.mockResolvedValueOnce({ success: true, data: exportContent });
  vi.mocked(downloadTermbase).mockImplementationOnce(() => {
    throw new Error("download failed");
  });
  await act(() => result.current.exportTermbase("one"));
  expect(toast).toHaveBeenLastCalledWith("download failed", "error");
  expect(result.current.exportingIds.size).toBe(0);
});

test.each([true, false])(
  "aborts on unmount and ignores late responses (success: %s)",
  async (success) => {
    const { result, dataSource, pending, unmount, toast } = renderExport();
    let task: Promise<void> | undefined;
    act(() => {
      task = result.current.exportTermbase("one");
    });
    unmount();
    expect(dataSource.exportTermbase.mock.calls[0]?.[1]?.aborted).toBe(true);
    await act(async () => {
      pending.resolve(
        success ? { success: true, data: exportContent } : { success: false, error: "gone" },
      );
      await task;
    });
    expect(downloadTermbase).not.toHaveBeenCalled();
    expect(toast).not.toHaveBeenCalled();
  },
);

test("cancels the previous project without blocking or clearing a new export of the same ID", async () => {
  const { result, dataSource, pending, rerender } = renderExport();
  let oldTask: Promise<void> | undefined;
  act(() => {
    oldTask = result.current.exportTermbase("one");
  });
  rerender({ projectId: "project-2" });
  expect(dataSource.exportTermbase.mock.calls[0]?.[1]?.aborted).toBe(true);
  expect(result.current.exportingIds.size).toBe(0);
  const next = deferredExport();
  dataSource.exportTermbase.mockReturnValueOnce(next.promise);
  let newTask: Promise<void> | undefined;
  act(() => {
    newTask = result.current.exportTermbase("one");
  });
  await act(async () => {
    pending.resolve({ success: true, data: "old" });
    await oldTask;
  });
  expect(downloadTermbase).not.toHaveBeenCalled();
  expect(result.current.exportingIds.has("one")).toBe(true);
  await act(async () => {
    next.resolve({ success: true, data: "new" });
    await newTask;
  });
  expect(downloadTermbase).toHaveBeenCalledExactlyOnceWith("new");
});
