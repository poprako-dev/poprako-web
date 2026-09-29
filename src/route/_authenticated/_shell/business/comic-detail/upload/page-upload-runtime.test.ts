import { createTestApi } from "@/test-resource/api-client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const apiMocks = vi.hoisted(() => ({
  listPages: vi.fn(),
  allocChapterPages: vi.fn(),
  allocExistingPageUpload: vi.fn(),
  updatePage: vi.fn(),
  uploadToPresignedUrl: vi.fn(),
}));

const hashMocks = vi.hoisted(() => ({
  hashPageFile: vi.fn(),
}));

function noop(): void {
  return;
}

vi.mock("@/route/_authenticated/business/page/page-request", () => apiMocks);
vi.mock("@/shared/utility/hash/image-hash", () => hashMocks);

import {
  cancelAllPageUploads,
  startChapterPageUpload,
  startPageReupload,
} from "@/route/_authenticated/_shell/business/comic-detail/upload/page-upload";
import { getPageUploadTaskState } from "@/route/_authenticated/_shell/business/comic-detail/upload/page-upload-store";
import { useAppStore } from "@/route/business/session/session-store";
import type { AllocatedPage } from "@/route/_authenticated/business/page/page";

function file(name: string, byte = 1): File {
  return new File([new Uint8Array([byte])], name, { type: "image/png" });
}

function slot(pageId: string, imageVersion = 1): AllocatedPage {
  return {
    pageId,
    index: Number(pageId.replaceAll(/\D/g, "")) || 0,
    imageHash: `hash-${pageId}`,
    extension: "png",
    slot: {
      putUrl: `https://upload.example/${pageId}/${String(imageVersion)}`,
      imageVersion,
      headers: {},
    },
  };
}

describe("page upload coordinator", () => {
  beforeEach(() => {
    cancelAllPageUploads();
    vi.clearAllMocks();
    apiMocks.listPages.mockResolvedValue({ success: true, data: [] });
    apiMocks.updatePage.mockResolvedValue({ success: true, data: undefined });
    apiMocks.uploadToPresignedUrl.mockResolvedValue({
      success: true,
      data: undefined,
      httpStatus: 200,
    });
  });

  afterEach(() => {
    cancelAllPageUploads();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  test("re-allocates and retries recoverable PUT failures twice", async () => {
    vi.useFakeTimers();
    hashMocks.hashPageFile.mockResolvedValue({ imageHash: "hash-page-1" });
    apiMocks.allocChapterPages.mockResolvedValue({
      success: true,
      data: { pages: [slot("page-1")] },
    });
    apiMocks.uploadToPresignedUrl
      .mockResolvedValueOnce({
        success: false,
        error: "上传失败: HTTP 500",
        httpStatus: 500,
        failureKind: "http",
      })
      .mockResolvedValueOnce({
        success: false,
        error: "上传超时",
        failureKind: "timeout",
      })
      .mockResolvedValueOnce({
        success: true,
        data: undefined,
        httpStatus: 200,
      });
    apiMocks.allocExistingPageUpload
      .mockResolvedValueOnce({ success: true, data: slot("page-1", 1) })
      .mockResolvedValueOnce({ success: true, data: slot("page-1", 1) });

    const started = await startChapterPageUpload(
      { ...createTestApi(), putPresigned: apiMocks.uploadToPresignedUrl },
      "chapter-1",
      [file("001.png")],
    );
    await vi.advanceTimersByTimeAsync(1000);
    await vi.advanceTimersByTimeAsync(2000);
    const summary = await started.completion;

    expect(summary).toEqual({
      succeeded: 1,
      failed: 0,
      reportedValidationFailures: 0,
    });
    expect(apiMocks.uploadToPresignedUrl).toHaveBeenCalledTimes(3);
    expect(apiMocks.allocExistingPageUpload).toHaveBeenCalledTimes(2);
    expect(apiMocks.allocExistingPageUpload).toHaveBeenCalledWith(expect.any(Object), {
      pageId: "page-1",
      rawIdent: "001.png",
      imageHash: "hash-page-1",
      newByteLen: 1,
      extension: "png",
    });
    expect(apiMocks.updatePage).toHaveBeenCalledTimes(1);
  });

  test("owns mark-uploaded retries after the caller releases the task", async () => {
    vi.useFakeTimers();
    hashMocks.hashPageFile.mockResolvedValue({ imageHash: "hash-page-1" });
    apiMocks.allocChapterPages.mockResolvedValue({
      success: true,
      data: { pages: [slot("page-1")] },
    });
    apiMocks.updatePage
      .mockResolvedValueOnce({ success: false, error: "temporary failure" })
      .mockRejectedValueOnce(new Error("network failure"))
      .mockResolvedValueOnce({ success: true, data: undefined });

    const started = await startChapterPageUpload(
      { ...createTestApi(), putPresigned: apiMocks.uploadToPresignedUrl },
      "chapter-1",
      [file("001.png")],
    );
    await vi.advanceTimersByTimeAsync(1000);
    await vi.advanceTimersByTimeAsync(2000);
    const summary = await started.completion;

    expect(summary).toEqual({
      succeeded: 1,
      failed: 0,
      reportedValidationFailures: 0,
    });
    expect(apiMocks.updatePage).toHaveBeenCalledTimes(3);
    expect(
      Object.values(getPageUploadTaskState().tasks).some(
        (task) => task.pageId === "page-1" && task.status === "succeeded",
      ),
    ).toBe(true);
  });

  test("ignores an allocation response from a previous session", async () => {
    let finishAllocation: (result: unknown) => void = noop;
    hashMocks.hashPageFile.mockResolvedValue({ imageHash: "hash-page-1" });
    apiMocks.allocChapterPages.mockImplementation(
      () =>
        new Promise((resolve) => {
          finishAllocation = resolve;
        }),
    );

    const started = startChapterPageUpload(
      { ...createTestApi(), putPresigned: apiMocks.uploadToPresignedUrl },
      "chapter-1",
      [file("001.png")],
    );
    await vi.waitFor(() => {
      expect(apiMocks.allocChapterPages).toHaveBeenCalledOnce();
    });
    const queued = startChapterPageUpload(
      { ...createTestApi(), putPresigned: apiMocks.uploadToPresignedUrl },
      "chapter-1",
      [file("002.png")],
    );
    await vi.waitFor(() => {
      expect(Object.keys(getPageUploadTaskState().tasks)).toHaveLength(2);
    });
    useAppStore.setState((state) => ({ generation: state.generation + 1 }));
    finishAllocation({ success: true, data: { pages: [slot("page-1")] } });

    const results = await Promise.allSettled([started, queued]);
    expect(results.every((result) => result.status === "rejected")).toBe(true);
    expect(apiMocks.listPages).toHaveBeenCalledOnce();
    expect(apiMocks.allocChapterPages).toHaveBeenCalledOnce();
    expect(apiMocks.uploadToPresignedUrl).not.toHaveBeenCalled();
    expect(getPageUploadTaskState().tasks).toEqual({});
  });

  test("does not issue a queued page allocation after the session changes", async () => {
    let finishListPages: (result: unknown) => void = noop;
    hashMocks.hashPageFile.mockResolvedValue({ imageHash: "hash-page" });
    apiMocks.listPages.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishListPages = resolve;
        }),
    );

    const chapterUpload = startChapterPageUpload(
      { ...createTestApi(), putPresigned: apiMocks.uploadToPresignedUrl },
      "chapter-1",
      [file("001.png")],
    );
    await vi.waitFor(() => {
      expect(apiMocks.listPages).toHaveBeenCalledOnce();
    });
    const reupload = await startPageReupload(
      { ...createTestApi(), putPresigned: apiMocks.uploadToPresignedUrl },
      "chapter-1",
      "page-queued",
      file("002.png"),
    );
    await vi.waitFor(() => {
      expect(apiMocks.allocExistingPageUpload).not.toHaveBeenCalled();
    });

    useAppStore.setState((state) => ({ generation: state.generation + 1 }));
    finishListPages({ success: true, data: [] });

    await expect(chapterUpload).rejects.toThrow("会话已变更");
    await expect(reupload.completion).resolves.toMatchObject({
      succeeded: 0,
      failed: 1,
    });
    expect(apiMocks.allocExistingPageUpload).not.toHaveBeenCalled();
    expect(apiMocks.allocChapterPages).not.toHaveBeenCalled();
  });

  test("ignores a late upload confirmation after the session changes", async () => {
    let finishConfirmation: (result: unknown) => void = noop;
    const onPageUploaded = vi.fn();
    hashMocks.hashPageFile.mockResolvedValue({ imageHash: "hash-page-1" });
    apiMocks.allocChapterPages.mockResolvedValue({
      success: true,
      data: { pages: [slot("page-1")] },
    });
    apiMocks.updatePage.mockImplementation(
      () =>
        new Promise((resolve) => {
          finishConfirmation = resolve;
        }),
    );

    const started = await startChapterPageUpload(
      { ...createTestApi(), putPresigned: apiMocks.uploadToPresignedUrl },
      "chapter-1",
      [file("001.png")],
      {
        onPagesAllocated: noop,
        onPageUploaded,
      },
    );
    await vi.waitFor(() => {
      expect(apiMocks.updatePage).toHaveBeenCalledOnce();
    });
    useAppStore.setState((state) => ({ generation: state.generation + 1 }));
    finishConfirmation({ success: true, data: undefined });

    expect(await started.completion).toMatchObject({ succeeded: 0, failed: 1 });
    expect(onPageUploaded).not.toHaveBeenCalled();
    expect(getPageUploadTaskState().tasks).toEqual({});
  });

  test("treats a null reupload slot as an already accepted identity", async () => {
    hashMocks.hashPageFile.mockResolvedValue({ imageHash: "hash-page-1" });
    apiMocks.allocExistingPageUpload.mockResolvedValue({
      success: true,
      data: {
        ...slot("page-1"),
        slot: null,
      },
    });

    const started = await startPageReupload(
      { ...createTestApi(), putPresigned: apiMocks.uploadToPresignedUrl },
      "chapter-1",
      "page-1",
      file("001.png"),
    );
    const summary = await started.completion;

    expect(summary).toEqual({
      succeeded: 1,
      failed: 0,
      reportedValidationFailures: 0,
    });
    expect(apiMocks.uploadToPresignedUrl).not.toHaveBeenCalled();
    expect(apiMocks.updatePage).not.toHaveBeenCalled();
  });

  test("keeps alloc, PUT, and mark serial for the same page", async () => {
    const events: string[] = [];
    let finishFirstPut: () => void = noop;
    const firstPut = new Promise<{
      success: true;
      data: undefined;
      httpStatus: number;
    }>((resolve) => {
      finishFirstPut = () => {
        resolve({
          success: true,
          data: undefined,
          httpStatus: 200,
        });
      };
    });
    hashMocks.hashPageFile
      .mockResolvedValueOnce({ imageHash: "hash-a" })
      .mockResolvedValueOnce({ imageHash: "hash-b" });
    apiMocks.allocExistingPageUpload
      .mockImplementationOnce(() => {
        events.push("alloc-a");
        return { success: true, data: slot("page-1", 1) };
      })
      .mockImplementationOnce(() => {
        events.push("alloc-b");
        return { success: true, data: slot("page-1", 2) };
      });
    apiMocks.uploadToPresignedUrl
      .mockImplementationOnce(() => {
        events.push("put-a");
        return firstPut;
      })
      .mockImplementationOnce(() => {
        events.push("put-b");
        return { success: true, data: undefined, httpStatus: 200 };
      });
    apiMocks.updatePage.mockImplementation(
      (_client: unknown, _pageId: string, args: { imageVersion?: number | undefined }) => {
        events.push(`mark-${String(args.imageVersion)}`);
        return { success: true, data: undefined };
      },
    );

    const first = await startPageReupload(
      { ...createTestApi(), putPresigned: apiMocks.uploadToPresignedUrl },
      "chapter-1",
      "page-1",
      file("a.png"),
    );
    await vi.waitFor(() => {
      expect(events).toEqual(["alloc-a", "put-a"]);
    });

    const second = await startPageReupload(
      { ...createTestApi(), putPresigned: apiMocks.uploadToPresignedUrl },
      "chapter-1",
      "page-1",
      file("b.png"),
    );
    expect(events).toEqual(["alloc-a", "put-a"]);

    finishFirstPut();
    await first.completion;
    await second.completion;

    expect(events).toEqual(["alloc-a", "put-a", "mark-1", "alloc-b", "put-b", "mark-2"]);
  });
});
