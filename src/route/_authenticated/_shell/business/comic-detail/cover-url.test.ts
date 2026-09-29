import { describe, expect, it } from "vitest";
import type { PageInfo } from "@/route/_authenticated/business/page/page";
import { resolveComicDetailCoverUrl } from "@/route/_authenticated/_shell/business/comic-detail/cover-url";

function page(overrides: Partial<PageInfo> = {}): PageInfo {
  return {
    id: "page-1",
    chapterId: "chapter-1",
    index: 0,
    imageUrl: "https://example.com/page-1.png",
    imageThumbnailUrl: "https://example.com/page-1-thumbnail.png",
    isUploaded: true,
    totalUnitCount: 0,
    translatedUnitCount: 0,
    proofreadUnitCount: 0,
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

describe("resolveComicDetailCoverUrl", () => {
  it("keeps the comic cover when one is already available", () => {
    expect(
      resolveComicDetailCoverUrl({
        isCoverUploaded: true,
        comicCoverThumbnailUrl: "https://example.com/cover.png",
        selectedChapterIndex: 0,
        pages: [page()],
      }),
    ).toBe("https://example.com/cover.png");
  });

  it("uses the uploaded first page of the first chapter as the local fallback", () => {
    expect(
      resolveComicDetailCoverUrl({
        isCoverUploaded: false,
        selectedChapterIndex: 0,
        pages: [page()],
      }),
    ).toBe("https://example.com/page-1-thumbnail.png");
  });

  it("does not use an unuploaded page or a page from a later chapter", () => {
    expect(
      resolveComicDetailCoverUrl({
        isCoverUploaded: false,
        selectedChapterIndex: 0,
        pages: [page({ isUploaded: false })],
      }),
    ).toBeNull();
    expect(
      resolveComicDetailCoverUrl({
        isCoverUploaded: false,
        selectedChapterIndex: 1,
        pages: [page()],
      }),
    ).toBeNull();
  });
});
