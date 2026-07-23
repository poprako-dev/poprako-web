import { beforeEach, describe, expect, test, vi } from "vitest";

const apiMocks = vi.hoisted(() => ({
  listPages: vi.fn(),
  reserveChapterPages: vi.fn(),
  reserveExistingPageUpload: vi.fn(),
  updatePage: vi.fn(),
  uploadToPresignedUrl: vi.fn(),
}));

const hashMocks = vi.hoisted(() => ({
  hashPageFile: vi.fn(),
}));

vi.mock("@/features/ComicPlayground/api/page", () => apiMocks);
vi.mock("./pageHash", () => hashMocks);

import { addChapterPages } from "./pageUpload";

describe("addChapterPages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMocks.updatePage.mockResolvedValue({ success: true, data: undefined });
    apiMocks.uploadToPresignedUrl.mockResolvedValue({
      success: true,
      data: undefined,
      httpStatus: 200,
    });
  });

  test("reserves the full manifest and uploads only appended pages", async () => {
    const file = new File([new Uint8Array([1, 2, 3])], "002.png", {
      type: "image/png",
    });
    const callbacks = {
      onPagesReserved: vi.fn(),
      onPageUploaded: vi.fn(),
      onPageUploadProgress: vi.fn(),
    };

    apiMocks.listPages.mockResolvedValue({
      success: true,
      data: [
        {
          id: "page-existing",
          imageHash: "existing-hash",
          byteLength: 2,
          extension: "png",
        },
      ],
    });
    hashMocks.hashPageFile.mockResolvedValue({ imageHash: "new-hash" });
    apiMocks.reserveChapterPages.mockResolvedValue({
      success: true,
      data: {
        pages: [
          {
            pageId: "page-existing",
            index: 0,
            imageHash: "existing-hash",
            byteLength: 2,
            extension: "png",
            slot: null,
          },
          {
            pageId: "page-new",
            index: 1,
            imageHash: "new-hash",
            byteLength: 3,
            extension: "png",
            slot: {
              putUrl: "https://upload.example/page-new",
              imageVersion: 1,
              headers: {
                "content-type": "image/png",
                "x-amz-checksum-sha256": "new-hash",
              },
            },
          },
        ],
      },
    });

    await addChapterPages({
      chapterId: "chapter-1",
      files: [file],
      callbacks,
      logPrefix: "test",
    });

    expect(apiMocks.reserveChapterPages).toHaveBeenCalledWith({
      chapterId: "chapter-1",
      pages: [
        {
          pageId: "page-existing",
          imageHash: "existing-hash",
          byteLength: 2,
          extension: "png",
        },
        {
          imageHash: "new-hash",
          byteLength: 3,
          extension: "png",
        },
      ],
    });
    expect(apiMocks.uploadToPresignedUrl).toHaveBeenCalledWith(
      "https://upload.example/page-new",
      file,
      {
        "content-type": "image/png",
        "x-amz-checksum-sha256": "new-hash",
      },
      expect.any(Function),
    );
    expect(apiMocks.updatePage).toHaveBeenCalledWith("page-new", {
      isUploaded: true,
      imageVersion: 1,
    });
    expect(callbacks.onPagesReserved).toHaveBeenCalledWith([
      { pageId: "page-new", index: 1, fileIndex: 0 },
    ]);
  });

  test("rejects an existing page without image identity", async () => {
    const file = new File([new Uint8Array([1])], "002.png", {
      type: "image/png",
    });
    apiMocks.listPages.mockResolvedValue({
      success: true,
      data: [{ id: "page-existing" }],
    });

    await expect(addChapterPages({
      chapterId: "chapter-1",
      files: [file],
      logPrefix: "test",
    })).rejects.toThrow("缺少图片身份信息");
    expect(apiMocks.reserveChapterPages).not.toHaveBeenCalled();
  });

  test("does not append images already present in the chapter", async () => {
    const files = [
      new File([new Uint8Array([1])], "001.png", { type: "image/png" }),
      new File([new Uint8Array([2])], "002.png", { type: "image/png" }),
      new File([new Uint8Array([3])], "003.png", { type: "image/png" }),
      new File([new Uint8Array([4])], "004.png", { type: "image/png" }),
      new File([new Uint8Array([5])], "005.png", { type: "image/png" }),
      new File([new Uint8Array([6])], "006.png", { type: "image/png" }),
      new File([new Uint8Array([7])], "007.png", { type: "image/png" }),
      new File([new Uint8Array([8])], "008.png", { type: "image/png" }),
    ];
    const callbacks = {
      onPagesReserved: vi.fn(),
      onPageUploaded: vi.fn(),
      onPageUploadProgress: vi.fn(),
    };

    const existingPages = [1, 2, 3].map((index) => ({
      id: `page-${index}`,
      imageHash: `hash-${index}`,
      byteLength: 1,
      extension: "png",
    }));

    apiMocks.listPages.mockResolvedValue({ success: true, data: existingPages });

    for (let index = 1; index <= 8; index++) {
      hashMocks.hashPageFile.mockResolvedValueOnce({ imageHash: `hash-${index}` });
    }

    apiMocks.reserveChapterPages.mockResolvedValue({
      success: true,
      data: {
        pages: [
          ...existingPages.map((page, index) => ({
            ...page,
            index,
            slot: null,
          })),
          ...[4, 5, 6, 7, 8].map((index) => ({
            pageId: `page-${index}`,
            index: index - 1,
            imageHash: `hash-${index}`,
            byteLength: 1,
            extension: "png",
            slot: {
              putUrl: `https://upload.example/page-${index}`,
              imageVersion: 1,
              headers: {},
            },
          })),
        ],
      },
    });

    await addChapterPages({
      chapterId: "chapter-1",
      files,
      callbacks,
      logPrefix: "test",
    });

    expect(apiMocks.reserveChapterPages).toHaveBeenCalledWith({
      chapterId: "chapter-1",
      pages: [
        ...existingPages.map((page) => ({
          pageId: page.id,
          imageHash: page.imageHash,
          byteLength: page.byteLength,
          extension: page.extension,
        })),
        ...[4, 5, 6, 7, 8].map((index) => ({
          imageHash: `hash-${index}`,
          byteLength: 1,
          extension: "png",
        })),
      ],
    });

    expect(apiMocks.uploadToPresignedUrl).toHaveBeenCalledTimes(5);
    expect(callbacks.onPagesReserved).toHaveBeenCalledWith([
      { pageId: "page-4", index: 3, fileIndex: 3 },
      { pageId: "page-5", index: 4, fileIndex: 4 },
      { pageId: "page-6", index: 5, fileIndex: 5 },
      { pageId: "page-7", index: 6, fileIndex: 6 },
      { pageId: "page-8", index: 7, fileIndex: 7 },
    ]);
  });

  test("retries marking uploaded on transient failure then succeeds", async () => {
    const file = new File([new Uint8Array([1, 2, 3])], "001.png", {
      type: "image/png",
    });

    apiMocks.listPages.mockResolvedValue({ success: true, data: [] });
    hashMocks.hashPageFile.mockResolvedValue({ imageHash: "hash-1" });
    apiMocks.reserveChapterPages.mockResolvedValue({
      success: true,
      data: {
        pages: [
          {
            pageId: "page-1",
            index: 0,
            imageHash: "hash-1",
            byteLength: 3,
            extension: "png",
            slot: {
              putUrl: "https://upload.example/page-1",
              imageVersion: 1,
              headers: {},
            },
          },
        ],
      },
    });

    // Fail the first two updatePage calls, succeed on the third
    apiMocks.updatePage
      .mockRejectedValueOnce(new Error("network error"))
      .mockResolvedValueOnce({ success: false, error: "server error" } as any)
      .mockResolvedValueOnce({ success: true, data: undefined });

    await addChapterPages({
      chapterId: "chapter-1",
      files: [file],
      logPrefix: "test",
    });

    expect(apiMocks.updatePage).toHaveBeenCalledTimes(3);
    expect(apiMocks.updatePage).toHaveBeenCalledWith("page-1", {
      isUploaded: true,
      imageVersion: 1,
    });
  });

  test("retries marking uploaded then throws after exhausting attempts", async () => {
    const file = new File([new Uint8Array([1, 2, 3])], "001.png", {
      type: "image/png",
    });

    apiMocks.listPages.mockResolvedValue({ success: true, data: [] });
    hashMocks.hashPageFile.mockResolvedValue({ imageHash: "hash-1" });
    apiMocks.reserveChapterPages.mockResolvedValue({
      success: true,
      data: {
        pages: [
          {
            pageId: "page-1",
            index: 0,
            imageHash: "hash-1",
            byteLength: 3,
            extension: "png",
            slot: {
              putUrl: "https://upload.example/page-1",
              imageVersion: 1,
              headers: {},
            },
          },
        ],
      },
    });

    apiMocks.updatePage.mockResolvedValue({
      success: false,
      error: "persistent error",
    } as any);

    await expect(addChapterPages({
      chapterId: "chapter-1",
      files: [file],
      logPrefix: "test",
    })).rejects.toThrow("persistent error");

    expect(apiMocks.updatePage).toHaveBeenCalledTimes(3);
  });
});
