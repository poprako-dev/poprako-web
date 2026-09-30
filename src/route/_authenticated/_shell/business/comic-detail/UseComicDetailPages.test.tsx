import { act, cleanup, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { useAppStore } from "@/route/business/session/session-store";
import { startChapterPageUpload } from "./upload/page-upload";
import {
  clearPageUploadTasks,
  patchPageUploadTask,
  getPageUploadTaskState,
} from "./upload/page-upload-store";
import { deferred, page, task, harness, flush } from "./PageResultsFixture";
import type { ChapterInfo } from "@/route/_authenticated/business/chapter/chapter";
import type { PageInfo } from "@/route/_authenticated/business/page/page";
import type { Result } from "@/shared/utility/result";

vi.mock("./upload/page-upload", () => ({
  startChapterPageUpload: vi.fn(),
  startPageReupload: vi.fn(),
}));

afterEach(() => {
  cleanup();
  clearPageUploadTasks();
});

test("切章后忽略旧章节成功任务的晚到页面", async () => {
  const view = harness();
  await flush(() => {
    task();
  });
  await flush(() => {
    view.rerender({ chapterId: "b" });
  });
  await flush(() => {
    view.response.resolve(Response.json({ code: 0, data: page("a") }));
  });
  expect(view.result.current.pages).toEqual([]);
});

test("回填失败不会无限重试，用户刷新后重取失败任务", async () => {
  const view = harness();
  await flush(() => {
    task();
  });
  await flush(() => {
    view.response.resolve(Response.json({ code: 500, message: "失败" }, { status: 500 }));
  });
  expect(view.result.current.pageRecoveryNeeded).toBe(true);
  await flush(() => {
    patchPageUploadTask("task", { progress: 100 });
  });
  expect(view.fetchImpl).toHaveBeenCalledTimes(1);
  await act(async () => {
    const reload = view.result.current.reloadCurrentPages();
    view.responseAt(1).resolve(Response.json({ code: 0, data: page("a") }));
    await reload;
  });
  expect(view.fetchImpl).toHaveBeenCalledTimes(2);
  expect(view.result.current.pages[0]?.imageUrl).toBe("https://fresh");
  expect(view.result.current.pageRecoveryNeeded).toBe(false);
});

test("旧重传晚于新任务且无关任务进度变化不取消回填", async () => {
  const view = harness();
  await flush(() => {
    task("old");
  });
  await flush(() => {
    task("new");
  });
  await flush(() => {
    patchPageUploadTask("old", { progress: 90 });
  });
  await flush(() => {
    view.responseAt(1).resolve(Response.json({ code: 0, data: page("a", "new") }));
  });
  await flush(() => {
    view.response.resolve(Response.json({ code: 0, data: page("a", "old") }));
  });
  expect(view.result.current.pages[0]?.imageUrl).toBe("https://new");
  expect(view.fetchImpl).toHaveBeenCalledTimes(2);
});

test("初始列表晚于回填时保留更新的页面", async () => {
  const list = deferred<Result<PageInfo[]>>();
  const view = harness(vi.fn(() => list.promise));
  await flush(() => {
    task();
  });
  await flush(() => {
    view.response.resolve(Response.json({ code: 0, data: page("a") }));
  });
  await flush(() => {
    list.resolve({ success: true, data: [page("a", "stale")] });
  });
  expect(view.result.current.pages[0]?.imageUrl).toBe("https://fresh");
});

test("同章列表更新倒序到达只应用最后发起的请求", async () => {
  const first = deferred<Result<PageInfo[]>>();
  const second = deferred<Result<PageInfo[]>>();
  const third = deferred<Result<PageInfo[]>>();
  const view = harness(
    vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
      .mockReturnValueOnce(third.promise),
  );
  let earlier!: Promise<void>;
  let latest!: Promise<void>;
  await flush(() => {
    earlier = view.result.current.reloadCurrentPages();
    latest = view.result.current.reloadCurrentPages();
  });
  await act(async () => {
    third.resolve({ success: true, data: [page("a", "latest")] });
    await latest;
  });
  await act(async () => {
    second.resolve({ success: true, data: [page("a", "earlier")] });
    await earlier;
    first.resolve({ success: true, data: [] });
  });
  expect(view.result.current.pages[0]?.imageUrl).toBe("latest");
});

test("清空后旧列表和旧回填不能复活页面", async () => {
  const list = deferred<Result<PageInfo[]>>();
  const view = harness(vi.fn(() => list.promise));
  await flush(() => {
    task();
  });
  await act(async () => {
    await view.result.current.handleDeleteAllChapterPages();
  });
  await flush(() => {
    list.resolve({ success: true, data: [page("a", "stale")] });
    view.response.resolve(Response.json({ code: 0, data: page("a") }));
  });
  expect(view.result.current.pages).toEqual([]);
  expect(view.result.current.isDeletingChapterPages).toBe(false);
});

test("会话代际更新使旧回填失效", async () => {
  const view = harness();
  await flush(() => {
    task();
  });
  await flush(() => {
    clearPageUploadTasks();
    useAppStore.getState().setAccessToken("new-token");
  });
  await flush(() => {
    view.response.resolve(Response.json({ code: 0, data: page("a") }));
  });
  expect(view.result.current.pages).toEqual([]);
});

test("StrictMode清理重放后仍正常加载和回填", async () => {
  const view = harness(undefined, true);
  await flush(() => {
    task();
  });
  await flush(() => {
    view.response.resolve(Response.json({ code: 0, data: page("a") }));
  });
  expect(view.result.current.pages[0]?.imageUrl).toBe("https://fresh");
  expect(view.result.current.isPagesLoading).toBe(false);
});

test("卸载停止详情展示与通知，上传完成仍由跨导航运行器持有", async () => {
  const completion = deferred<{
    succeeded: number;
    failed: number;
    reportedValidationFailures: number;
  }>();
  vi.mocked(startChapterPageUpload).mockResolvedValue({
    batchId: "batch",
    allocatedCount: 1,
    skippedCount: 0,
    completion: completion.promise,
  });
  const view = harness();
  await act(async () => {
    await view.result.current.handleAddRawPages([new File(["png"], "page.png")]);
    task();
  });
  view.unmount();
  await flush(() => {
    view.response.resolve(Response.json({ code: 0, data: page("a") }));
    completion.resolve({ succeeded: 0, failed: 1, reportedValidationFailures: 0 });
    patchPageUploadTask("task", { progress: 100 });
  });
  expect(getPageUploadTaskState().tasks["task"]?.status).toBe("succeeded");
  expect(view.showToast).not.toHaveBeenCalled();
});

test("删除期间切章不遗留删除状态且仍清理原章任务", async () => {
  const deleted = deferred<Result<void>>();
  const view = harness();
  view.onDeleteChapterPages.mockReturnValue(deleted.promise);
  await flush(() => {
    task();
  });
  let pending!: Promise<void>;
  await flush(() => {
    pending = view.result.current.handleDeleteAllChapterPages();
  });
  expect(view.result.current.isDeletingChapterPages).toBe(true);
  await flush(() => {
    view.rerender({ chapterId: "b" });
  });
  expect(view.result.current.isDeletingChapterPages).toBe(false);
  await act(async () => {
    deleted.resolve({ success: true, data: undefined });
    await pending;
  });
  expect(getPageUploadTaskState().tasks).toEqual({});
  expect(view.result.current.isDeletingChapterPages).toBe(false);
});

test("删除抛错后恢复可操作状态", async () => {
  const view = harness();
  view.onDeleteChapterPages.mockRejectedValue(new Error("删除中断"));
  await act(async () => {
    await view.result.current.handleDeleteAllChapterPages();
  });
  expect(view.result.current.isDeletingChapterPages).toBe(false);
  expect(view.showToast).toHaveBeenCalled();
});

test("旧删除结果不能复位新章节正在进行的删除", async () => {
  const old = deferred<Result<void>>();
  const latest = deferred<Result<void>>();
  const view = harness();
  view.onDeleteChapterPages.mockReturnValueOnce(old.promise).mockReturnValueOnce(latest.promise);
  let oldPending!: Promise<void>;
  let newPending!: Promise<void>;
  await flush(() => {
    oldPending = view.result.current.handleDeleteAllChapterPages();
  });
  await flush(() => {
    view.rerender({ chapterId: "b" });
  });
  await flush(() => {
    newPending = view.result.current.handleDeleteAllChapterPages();
  });
  await act(async () => {
    old.resolve({ success: true, data: undefined });
    await oldPending;
  });
  expect(view.result.current.isDeletingChapterPages).toBe(true);
  await act(async () => {
    latest.resolve({ success: true, data: undefined });
    await newPending;
  });
  expect(view.result.current.isDeletingChapterPages).toBe(false);
});

test("StrictMode已有成功任务在清理重放后重新回填", async () => {
  task();
  const view = harness(undefined, true);
  expect(view.fetchImpl).toHaveBeenCalledTimes(2);
  await flush(() => {
    view.responseAt(1).resolve(Response.json({ code: 0, data: page("a", "current") }));
  });
  await flush(() => {
    view.response.resolve(Response.json({ code: 0, data: page("a", "discarded") }));
  });
  expect(view.result.current.pages[0]?.imageUrl).toBe("https://current");
});

test("手动刷新晚到不能覆盖新章节列表", async () => {
  const old = deferred<Result<PageInfo[]>>();
  const load = vi.fn(() => Promise.resolve<Result<PageInfo[]>>({ success: true, data: [] }));
  const view = harness(load);
  await waitFor(() => {
    expect(view.result.current.isPagesLoading).toBe(false);
  });
  load.mockReturnValueOnce(old.promise);
  let pending!: Promise<void>;
  await flush(() => {
    pending = view.result.current.reloadCurrentPages();
  });
  await flush(() => {
    view.rerender({ chapterId: "b" });
  });
  await act(async () => {
    old.resolve({ success: true, data: [page("a")] });
    await pending;
  });
  expect(view.result.current.pages).toEqual([]);
});

test("清空后的章节刷新抛错保留上下文并可明确重试", async () => {
  const view = harness();
  const error = new Error("章节统计刷新中断");
  const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
  view.reloadLoadedChapters.mockRejectedValueOnce(error);
  await act(async () => {
    await view.result.current.handleDeleteAllChapterPages();
  });
  expect(view.result.current.pages).toEqual([]);
  expect(view.result.current.isDeletingChapterPages).toBe(false);
  expect(view.result.current.chapterStatsRecoveryNeeded).toBe(true);
  expect(log).toHaveBeenCalledWith("[ComicDetailModal] 清空后刷新章节统计异常", {
    chapterId: "a",
    error,
  });
  expect(view.showToast).toHaveBeenCalled();
  await act(async () => {
    await view.result.current.retryChapterStats();
  });
  expect(view.result.current.chapterStatsRecoveryNeeded).toBe(false);
  expect(view.reloadLoadedChapters).toHaveBeenCalledTimes(2);
  expect(view.onDeleteChapterPages).toHaveBeenCalledTimes(1);
});

test("清空后刷新期间切章不将旧刷新失败通知新章节", async () => {
  const view = harness();
  const refresh = deferred<ChapterInfo[] | null>();
  view.reloadLoadedChapters.mockReturnValueOnce(refresh.promise);
  let pending!: Promise<void>;
  await flush(() => {
    pending = view.result.current.handleDeleteAllChapterPages();
  });
  await flush(() => {
    view.rerender({ chapterId: "b" });
  });
  await act(async () => {
    refresh.reject(new Error("旧章节统计刷新中断"));
    await pending;
  });
  expect(view.result.current.chapterStatsRecoveryNeeded).toBe(false);
  expect(view.showToast).not.toHaveBeenCalled();
});

test("章节刷新返回null保留恢复入口且不重复既有失败通知", async () => {
  const view = harness();
  view.reloadLoadedChapters.mockResolvedValueOnce(null);
  await act(async () => {
    await view.result.current.handleDeleteAllChapterPages();
  });
  expect(view.result.current.chapterStatsRecoveryNeeded).toBe(true);
  expect(view.result.current.pages).toEqual([]);
  expect(view.showToast).not.toHaveBeenCalled();
  await act(async () => {
    await view.result.current.retryChapterStats();
  });
  expect(view.result.current.chapterStatsRecoveryNeeded).toBe(false);
  expect(view.reloadLoadedChapters).toHaveBeenCalledTimes(2);
  expect(view.onDeleteChapterPages).toHaveBeenCalledTimes(1);
});
