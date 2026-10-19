import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { createExportContext } from "./comic-detail-export-fixture";
import { createDirectoryFixture } from "./export-directory-fixture";
import { useComicDetailExportAction } from "./use-comic-detail-export-action";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

test("cancelling directory selection resets progress and allows another export", async () => {
  const context = createExportContext();
  const fixture = createDirectoryFixture();
  const picker = vi
    .fn()
    .mockRejectedValueOnce(new DOMException("Cancelled", "AbortError"))
    .mockResolvedValueOnce(fixture.handle);
  vi.stubGlobal("showDirectoryPicker", picker);
  const { result } = renderHook(() => useComicDetailExportAction(context));
  await act(async () => result.current.handleExportData({ includeImages: false }));
  expect(context.onExportChapter).not.toHaveBeenCalled();
  expect(context.showToast).toHaveBeenLastCalledWith("下载已取消", "info");
  expect(result.current.isExportingData).toBe(false);
  await act(async () => result.current.handleExportData({ includeImages: false }));
  expect(context.onExportChapter).toHaveBeenCalledOnce();
  expect(fixture.files.size).toBe(3);
  expect(result.current.isExportingData).toBe(false);
});

test("repeated clicks open only one directory picker while an export is pending", async () => {
  const context = createExportContext();
  let resolveSelection: ((handle: FileSystemDirectoryHandle) => void) | undefined;
  const selection = new Promise<FileSystemDirectoryHandle>((resolve) => {
    resolveSelection = resolve;
  });
  const picker = vi.fn().mockReturnValue(selection);
  vi.stubGlobal("showDirectoryPicker", picker);
  const { result } = renderHook(() => useComicDetailExportAction(context));
  let first: Promise<void> | undefined;
  act(() => {
    first = result.current.handleExportData();
    void result.current.handleExportData();
  });
  expect(picker).toHaveBeenCalledOnce();
  expect(result.current.isExportingData).toBe(true);
  act(() => {
    result.current.cancelExport();
  });
  await act(async () => {
    resolveSelection?.(createDirectoryFixture().handle);
    await first;
  });
  expect(context.onExportChapter).not.toHaveBeenCalled();
  expect(result.current.isExportingData).toBe(false);
});

test("permission failures offer retry and reset the busy state", async () => {
  const context = createExportContext();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  vi.stubGlobal(
    "showDirectoryPicker",
    vi.fn().mockRejectedValue(new DOMException("Denied", "NotAllowedError")),
  );
  const { result } = renderHook(() => useComicDetailExportAction(context));
  await act(async () => result.current.handleExportData());
  expect(context.onExportChapter).not.toHaveBeenCalled();
  expect(context.showToast).toHaveBeenLastCalledWith("导出失败，请重试", "error");
  expect(result.current.isExportingData).toBe(false);
});
