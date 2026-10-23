import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import type { Mock } from "vitest";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import type { Result } from "@/shared/utility/result";
import { createExportDataSource } from "./termbase-export-test-fixture";
import { useTermbaseAppend } from "./use-termbase-append";
import type { AppendTermbaseResult } from "./termbase-append-request";
import { MAX_APPEND_FILE_BYTES } from "./termbase-append-document";

const counts = { added: 1, updated: 2, unchanged: 3 };
const content = '{"terms":[{"source":"Elf","targets":["精灵"]}]}';

function file(name = "terms.json"): { file: File; read: Mock<() => Promise<string>> } {
  const file = new File([content], name, { type: "application/json" });
  const read = vi.fn(() => Promise.resolve(content));
  Object.defineProperty(file, "text", { value: read });
  return { file, read };
}

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}

beforeEach(() => {
  useToastStore.setState({ showToast: vi.fn() });
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

test("deduplicates reads and writes until the request finishes", async () => {
  const dataSource = createExportDataSource();
  const refresh = vi.fn();
  const pending = deferred<Result<AppendTermbaseResult>>();
  dataSource.appendTermbase.mockReturnValue(pending.promise);
  const { result } = renderHook(() => useTermbaseAppend(dataSource, refresh), {
    reactStrictMode: true,
  });
  const chosen = file();
  let task = Promise.resolve();
  await act(async () => {
    task = result.current.appendTermbase("base", chosen.file);
    await result.current.appendTermbase("base", chosen.file);
  });
  expect(chosen.read).toHaveBeenCalledOnce();
  expect(dataSource.appendTermbase).toHaveBeenCalledExactlyOnceWith("base", content);
  expect(result.current.pendingId).toBe("base");
  await act(async () => {
    pending.resolve({ success: true, data: counts });
    await task;
  });
  expect(result.current.pendingId).toBeNull();
  expect(refresh).toHaveBeenCalledExactlyOnceWith("base", counts);
  expect(useToastStore.getState().showToast).toHaveBeenCalledWith(
    "已追加：新增 1 条，更新 2 条，未变更 3 条",
    "success",
  );
});

test("does not submit a file read after changing data source", async () => {
  const first = createExportDataSource();
  const second = createExportDataSource();
  const refresh = vi.fn();
  const read = deferred<string>();
  const chosen = file();
  chosen.read.mockReturnValue(read.promise);
  const view = renderHook(({ dataSource }) => useTermbaseAppend(dataSource, refresh), {
    initialProps: { dataSource: first },
  });
  let task = Promise.resolve();
  act(() => {
    task = view.result.current.appendTermbase("base", chosen.file);
  });
  view.rerender({ dataSource: second });
  await act(async () => {
    read.resolve(content);
    await task;
  });
  expect(first.appendTermbase).not.toHaveBeenCalled();
  expect(second.appendTermbase).not.toHaveBeenCalled();
  expect(view.result.current.pendingId).toBeNull();
  expect(refresh).not.toHaveBeenCalled();
});

test("ignores completion after unmount without claiming that the server write was cancelled", async () => {
  const dataSource = createExportDataSource();
  const refresh = vi.fn();
  const pending = deferred<Result<AppendTermbaseResult>>();
  dataSource.appendTermbase.mockReturnValue(pending.promise);
  const view = renderHook(() => useTermbaseAppend(dataSource, refresh));
  let task = Promise.resolve();
  act(() => {
    task = view.result.current.appendTermbase("base", file().file);
  });
  await waitFor(() => {
    expect(dataSource.appendTermbase).toHaveBeenCalledOnce();
  });
  view.unmount();
  await act(async () => {
    pending.resolve({ success: true, data: counts });
    await task;
  });
  expect(refresh).not.toHaveBeenCalled();
  expect(useToastStore.getState().showToast).not.toHaveBeenCalled();
});

test.each(["network", "timeout", "protocol", "aborted"] as const)(
  "refreshes for inspection without replaying an uncertain %s failure",
  async (failureKind) => {
    const dataSource = createExportDataSource();
    dataSource.appendTermbase.mockResolvedValue({ success: false, failureKind, error: "请求失败" });
    const refresh = vi.fn();
    const { result } = renderHook(() => useTermbaseAppend(dataSource, refresh));
    await act(() => result.current.appendTermbase("base", file().file));
    expect(dataSource.appendTermbase).toHaveBeenCalledOnce();
    expect(refresh).toHaveBeenCalledExactlyOnceWith("base");
    expect(result.current.pendingId).toBeNull();
    expect(useToastStore.getState().showToast).toHaveBeenCalledWith(
      "追加结果尚未确认，请先查看术语库内容，勿重复追加",
      "error",
    );
  },
);

test("allows the user to choose the same file after a definite validation failure", async () => {
  const dataSource = createExportDataSource();
  dataSource.appendTermbase
    .mockResolvedValueOnce({
      success: false,
      httpStatus: 422,
      failureKind: "http",
      error: "原文重复",
    })
    .mockResolvedValueOnce({ success: true, data: counts });
  const { result } = renderHook(() => useTermbaseAppend(dataSource, vi.fn()));
  const chosen = file();
  await act(() => result.current.appendTermbase("base", chosen.file));
  expect(useToastStore.getState().showToast).toHaveBeenCalledWith("原文重复", "error");
  await act(() => result.current.appendTermbase("base", chosen.file));
  expect(dataSource.appendTermbase).toHaveBeenCalledTimes(2);
});

test("rejects unsupported extensions and oversized files before reading", async () => {
  const dataSource = createExportDataSource();
  const { result } = renderHook(() => useTermbaseAppend(dataSource, vi.fn()));
  const invalid = file("terms.txt");
  await act(() => result.current.appendTermbase("base", invalid.file));
  expect(invalid.read).not.toHaveBeenCalled();
  const large = file();
  Object.defineProperty(large.file, "size", { value: MAX_APPEND_FILE_BYTES + 1 });
  await act(() => result.current.appendTermbase("base", large.file));
  expect(large.read).not.toHaveBeenCalled();
  expect(dataSource.appendTermbase).not.toHaveBeenCalled();
});

test("distinguishes read errors from unexpected request rejections", async () => {
  const dataSource = createExportDataSource();
  const { result } = renderHook(() => useTermbaseAppend(dataSource, vi.fn()));
  const chosen = file();
  chosen.read.mockRejectedValue(new Error("read failed"));
  await act(() => result.current.appendTermbase("base", chosen.file));
  expect(dataSource.appendTermbase).not.toHaveBeenCalled();
  expect(useToastStore.getState().showToast).toHaveBeenLastCalledWith(
    "无法读取术语文件，请重新选择",
    "error",
  );
  dataSource.appendTermbase.mockRejectedValue(new Error("response lost"));
  await act(() => result.current.appendTermbase("base", file().file));
  expect(useToastStore.getState().showToast).toHaveBeenLastCalledWith(
    "追加结果尚未确认，请先查看术语库内容，勿重复追加",
    "error",
  );
});
