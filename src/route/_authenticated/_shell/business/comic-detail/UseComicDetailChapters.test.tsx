import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import type { ChapterInfo } from "@/route/_authenticated/business/chapter/chapter";
import type { Result } from "@/shared/utility/result";
import type { DetailContract } from "./comic-detail-type";
import { useComicDetailChapters } from "./use-comic-detail-chapters";
import { makeChapter } from "./test/comic-detail-story-fixtures";
import { deferred } from "@/test-resource/deferred";

afterEach(cleanup);

function chapter(index: number): ChapterInfo {
  return makeChapter(index, { comicId: "comic" });
}

function firstPage(): ChapterInfo[] {
  return Array.from({ length: 20 }, (_, index) => chapter(index + 1));
}

function scenario(initialChapterId?: string): {
  args: Parameters<typeof useComicDetailChapters>[0];
  onLoadChapters: ReturnType<typeof vi.fn<DetailContract["onLoadChapters"]>>;
  onLoadChapter: ReturnType<typeof vi.fn<DetailContract["onLoadChapter"]>>;
  showToast: ReturnType<typeof vi.fn>;
} {
  const onLoadChapters = vi
    .fn<DetailContract["onLoadChapters"]>()
    .mockResolvedValue({ success: true, data: firstPage() });
  const onLoadChapter = vi
    .fn<DetailContract["onLoadChapter"]>()
    .mockResolvedValue({ success: true, data: chapter(42) });
  const showToast = vi.fn();
  return {
    args: {
      comicId: "comic",
      pinnedChapter: chapter(42),
      initialChapterId,
      onLoadChapters,
      onLoadChapter,
      showToast,
    },
    onLoadChapters,
    onLoadChapter,
    showToast,
  };
}

test("without a deep link only the first list page loads", async () => {
  const { args, onLoadChapters, onLoadChapter } = scenario();
  const { result } = renderHook(() => useComicDetailChapters(args));
  await waitFor(() => {
    expect(result.current.isChaptersLoading).toBe(false);
  });
  expect(onLoadChapters).toHaveBeenCalledOnce();
  expect(onLoadChapter).not.toHaveBeenCalled();
  expect(result.current.chapters).toHaveLength(20);
  expect(result.current.selectedChapterId).toBe("chapter-1");
});

test("a deep chapter becomes available without waiting for the first list page", async () => {
  const { args, onLoadChapters, onLoadChapter } = scenario("chapter-42");
  const list = deferred<Result<ChapterInfo[]>>();
  onLoadChapters.mockReturnValue(list.promise);
  const { result } = renderHook(() => useComicDetailChapters(args));
  await waitFor(() => {
    expect(result.current.chapters).toEqual([chapter(42)]);
  });
  expect(onLoadChapter).toHaveBeenCalledExactlyOnceWith("chapter-42");
  expect(result.current.isSelectedChapterAvailable).toBe(true);
  expect(result.current.isChaptersLoading).toBe(true);
  await act(async () => {
    list.resolve({ success: true, data: firstPage() });
    await list.promise;
  });
  expect(result.current.chapters).toHaveLength(21);
  expect(result.current.selectedChapterId).toBe("chapter-42");
  expect(onLoadChapters).toHaveBeenCalledOnce();
});

test("the first page does not scan or wait for a deep target", async () => {
  const { args, onLoadChapters, onLoadChapter } = scenario("chapter-100");
  const target = deferred<Result<ChapterInfo>>();
  onLoadChapter.mockReturnValue(target.promise);
  const { result } = renderHook(() => useComicDetailChapters(args));
  await waitFor(() => {
    expect(result.current.isChaptersLoading).toBe(false);
  });
  expect(result.current.chapters).toHaveLength(20);
  expect(result.current.isSelectedChapterAvailable).toBe(false);
  expect(onLoadChapters).toHaveBeenCalledOnce();
  await act(async () => {
    target.resolve({ success: true, data: chapter(100) });
    await target.promise;
  });
  expect(result.current.selectedChapter?.id).toBe("chapter-100");
});

test("extra located chapters do not change list offsets or appear twice", async () => {
  const { args, onLoadChapters, onLoadChapter } = scenario("chapter-21");
  onLoadChapter.mockResolvedValue({ success: true, data: chapter(21) });
  const secondPage = Array.from({ length: 20 }, (_, index) => chapter(index + 21));
  onLoadChapters
    .mockResolvedValueOnce({ success: true, data: firstPage() })
    .mockResolvedValueOnce({ success: true, data: secondPage })
    .mockResolvedValue({ success: true, data: [] });
  const { result } = renderHook(() => useComicDetailChapters(args));
  await waitFor(() => {
    expect(result.current.chapters).toHaveLength(21);
  });
  act(() => {
    result.current.handleLoadMoreChapters();
  });
  await waitFor(() => {
    expect(result.current.isChaptersLoading).toBe(false);
  });
  expect(onLoadChapters).toHaveBeenNthCalledWith(2, { comicId: "comic", offset: 20, limit: 20 });
  expect(result.current.chapters).toHaveLength(40);
  expect(result.current.chapters.filter((value) => value.id === "chapter-21")).toHaveLength(1);
  act(() => {
    result.current.handleLoadMoreChapters();
  });
  await waitFor(() => {
    expect(result.current.isChaptersLoading).toBe(false);
  });
  expect(onLoadChapters).toHaveBeenNthCalledWith(3, { comicId: "comic", offset: 40, limit: 20 });
});

test("a target from another comic is rejected without scanning later pages", async () => {
  const { args, onLoadChapter, onLoadChapters, showToast } = scenario("chapter-100");
  onLoadChapter.mockResolvedValue({ success: true, data: { ...chapter(100), comicId: "other" } });
  const { result } = renderHook(() => useComicDetailChapters(args));
  await waitFor(() => {
    expect(showToast).toHaveBeenCalledWith("章节不属于当前漫画", "error");
  });
  expect(result.current.isSelectedChapterAvailable).toBe(false);
  expect(result.current.chapters).toHaveLength(20);
  expect(onLoadChapters).toHaveBeenCalledOnce();
});

test("an obsolete target response cannot replace the current target", async () => {
  const { args, onLoadChapter } = scenario("chapter-100");
  const old = deferred<Result<ChapterInfo>>();
  onLoadChapter
    .mockReturnValueOnce(old.promise)
    .mockResolvedValue({ success: true, data: chapter(101) });
  const { result, rerender } = renderHook(
    (initialChapterId) => useComicDetailChapters({ ...args, initialChapterId }),
    { initialProps: "chapter-100" },
  );
  rerender("chapter-101");
  await waitFor(() => {
    expect(result.current.selectedChapter?.id).toBe("chapter-101");
  });
  await act(async () => {
    old.resolve({ success: true, data: chapter(100) });
    await old.promise;
  });
  expect(result.current.selectedChapter?.id).toBe("chapter-101");
  expect(result.current.chapters.some((value) => value.id === "chapter-100")).toBe(false);
});

test("refreshing loaded chapters also refreshes an out-of-page target without changing offsets", async () => {
  const { args, onLoadChapter, onLoadChapters } = scenario("chapter-100");
  onLoadChapter
    .mockResolvedValueOnce({ success: true, data: chapter(100) })
    .mockResolvedValue({ success: true, data: { ...chapter(100), pageCount: 0 } });
  const { result } = renderHook(() => useComicDetailChapters(args));
  await waitFor(() => {
    expect(result.current.chapters).toHaveLength(21);
  });
  await act(async () => {
    await result.current.reloadLoadedChapters();
  });
  expect(result.current.selectedChapter?.pageCount).toBe(0);
  expect(onLoadChapter).toHaveBeenCalledTimes(2);
  expect(onLoadChapters).toHaveBeenLastCalledWith({ comicId: "comic", offset: 0, limit: 20 });
  act(() => {
    result.current.handleLoadMoreChapters();
  });
  await waitFor(() => {
    expect(result.current.isChaptersLoading).toBe(false);
  });
  expect(onLoadChapters).toHaveBeenLastCalledWith({ comicId: "comic", offset: 20, limit: 20 });
});
