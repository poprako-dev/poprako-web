import { createTestApi } from "@/test-resource/api-client";
import type { ApiClient } from "@/api/client";
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

vi.mock("@/route/_authenticated/business/page/page-request", () => apiMocks);
vi.mock("@/shared/utility/hash/image-hash", () => hashMocks);

import {
  cancelAllPageUploads,
  startChapterPageUpload,
  startPageReupload,
} from "@/route/_authenticated/_shell/business/comic-detail/upload/page-upload";
import { getPageUploadTaskState } from "@/route/_authenticated/_shell/business/comic-detail/upload/page-upload-store";
import type { AllocatedPage } from "@/route/_authenticated/business/page/page";
import type { PageUploadBatchSummary } from "./page-upload-types";

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

async function pageUploadScenario1(): Promise<void> {
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  apiMocks.listPages.mockResolvedValue({
    success: true,
    data: [
      {
        id: "page-existing",
        imageHash: "existing-hash",
        extension: "png",
        imageUrl: "",
      },
    ],
  });
  hashMocks.hashPageFile.mockResolvedValue({ imageHash: "new-hash" });
  apiMocks.allocChapterPages.mockResolvedValue({
    success: true,
    data: {
      pages: [
        {
          pageId: "page-existing",
          index: 0,
          imageHash: "existing-hash",
          extension: "png",
          slot: null,
        },
        {
          ...slot("page-1"),
          imageHash: "new-hash",
          index: 1,
        },
      ],
    },
  });

  const started = await startChapterPageUpload(
    { ...createTestApi(), putPresigned: apiMocks.uploadToPresignedUrl },
    "chapter-1",
    [file("001.png")],
  );
  const summary = await started.completion;

  expectFullManifestSuccess(summary);
  expect(fetchMock).not.toHaveBeenCalled();
  expectFullManifestAllocation();
}

function expectFullManifestSuccess(summary: PageUploadBatchSummary): void {
  expect(summary).toEqual({
    succeeded: 1,
    failed: 0,
    reportedValidationFailures: 0,
  });
}

function expectFullManifestAllocation(): void {
  expect(apiMocks.allocChapterPages).toHaveBeenCalledWith(expect.any(Object), {
    chapterId: "chapter-1",
    pages: [
      {
        pageId: "page-existing",
        imageHash: "existing-hash",
        extension: "png",
      },
      {
        rawIdent: "001.png",
        imageHash: "new-hash",
        newByteLen: 1,
        extension: "png",
      },
    ],
  });
}

function configurePendingPage(): void {
  apiMocks.listPages.mockResolvedValue({
    success: true,
    data: [
      {
        id: "page-pending",
        imageHash: "pending-hash",
        extension: "png",
        imageUrl: "",
        isUploaded: false,
      },
    ],
  });
  hashMocks.hashPageFile.mockResolvedValue({ imageHash: "pending-hash" });
  apiMocks.allocChapterPages.mockResolvedValue({
    success: true,
    data: { pages: [{ ...slot("page-pending", 2), imageHash: "pending-hash" }] },
  });
}

function configureUploadedPage(): void {
  apiMocks.listPages.mockResolvedValue({
    success: true,
    data: [
      {
        id: "page-uploaded",
        imageHash: "uploaded-hash",
        extension: "png",
        imageUrl: "https://cdn.example/page-uploaded.png",
        isUploaded: true,
      },
    ],
  });
  hashMocks.hashPageFile.mockResolvedValue({ imageHash: "uploaded-hash" });
  apiMocks.allocChapterPages.mockResolvedValue({
    success: true,
    data: { pages: [{ ...slot("page-uploaded"), imageHash: "uploaded-hash", slot: null }] },
  });
}

function failFirstPagePut({
  url: putUrl,
}: {
  url: string;
}): Awaited<ReturnType<ApiClient["putPresigned"]>> {
  if (putUrl.includes("page-1"))
    return {
      success: false,
      error: "上传失败: HTTP 400",
      httpStatus: 400,
      failureKind: "http",
    };
  return { success: true, data: undefined };
}

async function pageUploadScenario2(): Promise<void> {
  const oversizedFile = file("oversized.png");
  const oversizedByteLength = 21 * 1024 * 1024;
  Object.defineProperty(oversizedFile, "size", {
    value: oversizedByteLength,
  });
  hashMocks.hashPageFile.mockResolvedValue({ imageHash: "oversized-hash" });
  apiMocks.allocChapterPages.mockResolvedValue({
    success: true,
    data: {
      pages: [
        {
          ...slot("page-1"),
          imageHash: "oversized-hash",
          slot: null,
        },
      ],
    },
  });

  await startChapterPageUpload(
    { ...createTestApi(), putPresigned: apiMocks.uploadToPresignedUrl },
    "chapter-1",
    [oversizedFile],
  );

  expect(apiMocks.allocChapterPages).toHaveBeenCalledWith(expect.any(Object), {
    chapterId: "chapter-1",
    pages: [
      {
        rawIdent: "oversized.png",
        imageHash: "oversized-hash",
        newByteLen: oversizedByteLength,
        extension: "png",
      },
    ],
  });
}

async function pageUploadScenario3(): Promise<void> {
  hashMocks.hashPageFile.mockResolvedValue({ imageHash: "page-hash" });
  apiMocks.allocExistingPageUpload.mockResolvedValue({
    success: false,
    error: "后端文件大小限制",
    httpStatus: 422,
  });

  const started = await startPageReupload(
    { ...createTestApi(), putPresigned: apiMocks.uploadToPresignedUrl },
    "chapter-1",
    "page-1",
    file("001.png"),
  );

  await expect(started.completion).resolves.toEqual({
    succeeded: 0,
    failed: 1,
    reportedValidationFailures: 0,
  });
}

async function pageUploadScenario4(): Promise<void> {
  configurePendingPage();

  const started = await startChapterPageUpload(
    { ...createTestApi(), putPresigned: apiMocks.uploadToPresignedUrl },
    "chapter-1",
    [file("001.png")],
  );
  const summary = await started.completion;

  expect(summary).toEqual({
    succeeded: 1,
    failed: 0,
    reportedValidationFailures: 0,
  });
  expect(apiMocks.allocChapterPages).toHaveBeenCalledWith(expect.any(Object), {
    chapterId: "chapter-1",
    pages: [
      {
        pageId: "page-pending",
        rawIdent: "001.png",
        imageHash: "pending-hash",
        newByteLen: 1,
        extension: "png",
      },
    ],
  });
  expect(apiMocks.uploadToPresignedUrl).toHaveBeenCalledWith({
    url: "https://upload.example/page-pending/2",
    file: expect.any(File) as unknown,
    headers: {},
    onProgress: expect.any(Function) as unknown,
    signal: expect.any(AbortSignal) as unknown,
  });
}

async function pageUploadScenario5(): Promise<void> {
  configureUploadedPage();

  const started = await startChapterPageUpload(
    { ...createTestApi(), putPresigned: apiMocks.uploadToPresignedUrl },
    "chapter-1",
    [file("001.png")],
  );
  const summary = await started.completion;

  expect(summary).toEqual({
    succeeded: 0,
    failed: 0,
    reportedValidationFailures: 0,
  });
  expect(apiMocks.allocChapterPages).toHaveBeenCalledWith(expect.any(Object), {
    chapterId: "chapter-1",
    pages: [
      {
        pageId: "page-uploaded",
        rawIdent: "001.png",
        imageHash: "uploaded-hash",
        newByteLen: 1,
        extension: "png",
      },
    ],
  });
  expect(apiMocks.uploadToPresignedUrl).not.toHaveBeenCalled();
  expect(Object.values(getPageUploadTaskState().tasks)).toContainEqual(
    expect.objectContaining({
      pageId: "page-uploaded",
      index: 0,
      status: "succeeded",
      progress: 100,
      error: null,
    }),
  );
}

async function pageUploadScenario6(): Promise<void> {
  const files = [file("001.png", 1), file("002.png", 2), file("003.png", 3)];
  hashMocks.hashPageFile
    .mockResolvedValueOnce({ imageHash: "hash-page-1" })
    .mockResolvedValueOnce({ imageHash: "hash-page-2" })
    .mockResolvedValueOnce({ imageHash: "hash-page-3" });
  apiMocks.allocChapterPages.mockResolvedValue({
    success: true,
    data: {
      pages: [slot("page-1"), slot("page-2"), slot("page-3")],
    },
  });
  apiMocks.uploadToPresignedUrl.mockImplementation(failFirstPagePut);

  const started = await startChapterPageUpload(
    { ...createTestApi(), putPresigned: apiMocks.uploadToPresignedUrl },
    "chapter-1",
    files,
  );
  const summary = await started.completion;

  expect(summary).toEqual({
    succeeded: 2,
    failed: 1,
    reportedValidationFailures: 0,
  });
  expect(apiMocks.uploadToPresignedUrl).toHaveBeenCalledTimes(3);
  expect(apiMocks.allocExistingPageUpload).not.toHaveBeenCalled();
  expect(apiMocks.updatePage).toHaveBeenCalledTimes(2);
  expect(apiMocks.updatePage).toHaveBeenCalledWith(expect.any(Object), "page-2", {
    isUploaded: true,
    imageVersion: 1,
  });
  expect(apiMocks.updatePage).toHaveBeenCalledWith(expect.any(Object), "page-3", {
    isUploaded: true,
    imageVersion: 1,
  });
  expect(
    Object.values(getPageUploadTaskState().tasks).some(
      (task) => task.pageId === "page-1" && task.status === "failed",
    ),
  ).toBe(true);
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

  test("allocates the full manifest without reading existing image bytes", pageUploadScenario1);

  test(
    "sends oversized files to backend validation instead of rejecting locally",
    pageUploadScenario2,
  );

  test("keeps unreported backend 422 failures available to the UI", pageUploadScenario3);

  test(
    "re-allocates a matching pending page instead of skipping it as a duplicate",
    pageUploadScenario4,
  );

  test("refreshes a slotless page through the completed page task", pageUploadScenario5);

  test("continues other page tasks after one deterministic PUT failure", pageUploadScenario6);
});
