import { cleanup, renderHook, waitFor } from "@testing-library/react";
import type { RenderHookResult } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import type { ChapterInfo } from "@/route/_authenticated/business/chapter/chapter";
import type { DetailContract } from "@/route/_authenticated/_shell/business/comic-detail/comic-detail-type";
import { useComicDetailChapters } from "@/route/_authenticated/_shell/business/comic-detail/use-comic-detail-chapters";

afterEach(cleanup);

function chapter(id: string, index: number): ChapterInfo {
  return {
    id,
    comicId: "comic",
    index,
    subtitle: "",
    isPinned: false,
    pageCount: 0,
    totalUnitCount: 0,
    translatedUnitCount: 0,
    proofreadUnitCount: 0,
    stages: 0,
    creatorId: "user",
    createdAt: 0,
    updatedAt: 0,
  };
}

function loadChapters(pages: ChapterInfo[][]): DetailContract["onLoadChapters"] {
  return vi.fn(({ offset, limit }) =>
    Promise.resolve({ success: true as const, data: pages[Math.floor(offset / limit)] ?? [] }),
  ) as DetailContract["onLoadChapters"];
}

function renderChapters(
  onLoadChapters: DetailContract["onLoadChapters"],
  initialChapterId?: string,
): RenderHookResult<ReturnType<typeof useComicDetailChapters>, unknown> {
  const showToast = vi.fn();
  return renderHook(() =>
    useComicDetailChapters({
      comicId: "comic",
      pinnedChapter: chapter("chapter-42", 41),
      initialChapterId,
      onLoadChapters,
      showToast,
    }),
  );
}

test("without an initial chapter, load only the first page and select its first chapter", async () => {
  const firstPage = Array.from({ length: 20 }, (_, index) =>
    chapter(`chapter-${String(index + 1)}`, index),
  );
  const onLoadChapters = loadChapters([firstPage, [chapter("chapter-42", 41)]]);
  const { result } = renderChapters(onLoadChapters);

  await waitFor(() => {
    expect(result.current.isChaptersLoading).toBe(false);
  });

  expect(onLoadChapters).toHaveBeenCalledOnce();
  expect(result.current.chapters).toHaveLength(20);
  expect(result.current.selectedChapterId).toBe("chapter-1");
});

test("an initial chapter outside the first page loads subsequent pages", async () => {
  const firstPage = Array.from({ length: 20 }, (_, index) =>
    chapter(`chapter-${String(index + 1)}`, index),
  );
  const target = chapter("chapter-21", 20);
  const onLoadChapters = loadChapters([firstPage, [target]]);
  const { result } = renderChapters(onLoadChapters, target.id);

  await waitFor(() => {
    expect(result.current.isChaptersLoading).toBe(false);
  });

  expect(onLoadChapters).toHaveBeenCalledTimes(2);
  expect(onLoadChapters).toHaveBeenNthCalledWith(1, { comicId: "comic", offset: 0, limit: 20 });
  expect(onLoadChapters).toHaveBeenNthCalledWith(2, { comicId: "comic", offset: 20, limit: 20 });
  expect(result.current.selectedChapterId).toBe(target.id);
});
