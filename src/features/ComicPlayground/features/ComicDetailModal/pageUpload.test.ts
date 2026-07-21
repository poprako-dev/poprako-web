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
            upload: null,
          },
          {
            pageId: "page-new",
            index: 1,
            imageHash: "new-hash",
            byteLength: 3,
            extension: "png",
            upload: {
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
      { pageId: "page-new", index: 1 },
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
});
