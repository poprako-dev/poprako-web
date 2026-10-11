import { useCallback, useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import { showLocalApiFailure, showLocalCaughtError } from "@/route/business/request-error";
import type { ChapterInfo } from "@/route/_authenticated/business/chapter/chapter";
import type { ToastType } from "@/shared/component/notification-toast/notification-toast-type";
import type { DetailContract } from "@/route/_authenticated/_shell/business/comic-detail/comic-detail-type";

type ShowToast = (message: string, type: ToastType) => void;
type Args = {
  comicId: string;
  initialChapterId?: string | null | undefined;
  pinnedChapterId?: string | undefined;
  chapters: ChapterInfo[];
  hasMore: boolean;
  isLoading: boolean;
  setChapters: Dispatch<SetStateAction<ChapterInfo[]>>;
  setSelectedChapterId: Dispatch<SetStateAction<string | null>>;
  setChaptersHasMore: Dispatch<SetStateAction<boolean>>;
  setIsChaptersLoading: Dispatch<SetStateAction<boolean>>;
  onLoadChapters: DetailContract["onLoadChapters"];
  showToast: ShowToast;
};
type RequestArgs = Pick<
  Args,
  | "comicId"
  | "setChapters"
  | "setChaptersHasMore"
  | "setIsChaptersLoading"
  | "onLoadChapters"
  | "showToast"
>;
type InitialArgs = Omit<Args, "chapters" | "hasMore" | "isLoading">;

const CHAPTERS_LIMIT = 20;

async function loadChapterPage(
  comicId: string,
  offset: number,
  onLoadChapters: DetailContract["onLoadChapters"],
): ReturnType<NonNullable<DetailContract["onLoadChapters"]>> {
  return await onLoadChapters({ comicId, offset, limit: CHAPTERS_LIMIT });
}

function selectInitialChapter(
  loaded: ChapterInfo[],
  initialChapterId: string | null | undefined,
  pinnedChapterId: string | undefined,
): string | null {
  if (initialChapterId && loaded.some((chapter) => chapter.id === initialChapterId)) {
    return initialChapterId;
  }
  if (pinnedChapterId && loaded.some((chapter) => chapter.id === pinnedChapterId)) {
    return pinnedChapterId;
  }
  return loaded[0]?.id ?? null;
}

async function loadInitialChapters(args: InitialArgs, isCancelled: () => boolean): Promise<void> {
  const loaded: ChapterInfo[] = [];
  let offset = 0;
  let hasMore = true;
  args.setIsChaptersLoading(true);

  try {
    do {
      const res = await loadChapterPage(args.comicId, offset, args.onLoadChapters);
      if (isCancelled()) return;
      if (!res.success) {
        console.error("[ComicDetailModal] 加载章节失败:", res);
        showLocalApiFailure(res, args.showToast, "加载章节失败");
        return;
      }
      loaded.push(...res.data);
      hasMore = res.data.length === CHAPTERS_LIMIT;
      offset += res.data.length;
    } while (
      hasMore &&
      Boolean(args.initialChapterId) &&
      !loaded.some((item) => item.id === args.initialChapterId)
    );
    args.setChapters(loaded);
    args.setChaptersHasMore(hasMore);
    args.setSelectedChapterId(
      selectInitialChapter(loaded, args.initialChapterId, args.pinnedChapterId),
    );
  } catch (error) {
    if (!isCancelled()) {
      console.error("[ComicDetailModal] 加载章节异常:", error);
      showLocalCaughtError(error, args.showToast, "加载章节失败");
    }
  } finally {
    if (!isCancelled()) args.setIsChaptersLoading(false);
  }
}

async function loadMoreChapters(args: RequestArgs, offset: number): Promise<void> {
  try {
    const res = await loadChapterPage(args.comicId, offset, args.onLoadChapters);
    if (!res.success) {
      showLocalApiFailure(res, args.showToast, "加载更多章节失败");
      return;
    }
    args.setChapters((previous) => [...previous, ...res.data]);
    args.setChaptersHasMore(res.data.length === CHAPTERS_LIMIT);
  } catch (error) {
    showLocalCaughtError(error, args.showToast, "加载更多章节失败");
  } finally {
    args.setIsChaptersLoading(false);
  }
}

interface ChapterLoadingActions {
  handleLoadMoreChapters: () => void;
  reloadLoadedChapters: () => Promise<ChapterInfo[] | null>;
}

export function useComicDetailChapterLoading(args: Args): ChapterLoadingActions {
  const {
    comicId,
    chapters,
    hasMore,
    isLoading,
    setChapters,
    setChaptersHasMore,
    setIsChaptersLoading,
    onLoadChapters,
    showToast,
  } = args;
  const handleLoadMoreChapters = useCallback(() => {
    if (isLoading || !hasMore) return;
    setIsChaptersLoading(true);
    void loadMoreChapters(
      { comicId, onLoadChapters, setChapters, setChaptersHasMore, setIsChaptersLoading, showToast },
      chapters.length,
    );
  }, [
    chapters.length,
    comicId,
    hasMore,
    isLoading,
    onLoadChapters,
    setChapters,
    setChaptersHasMore,
    setIsChaptersLoading,
    showToast,
  ]);

  const reloadLoadedChapters = useCallback(async () => {
    const limit = Math.max(chapters.length, CHAPTERS_LIMIT);
    const res = await onLoadChapters({ comicId, offset: 0, limit });
    if (!res.success) {
      console.error("[ComicDetailModal] 刷新章节失败:", res);
      showLocalApiFailure(res, showToast, "刷新章节失败");
      return null;
    }
    setChapters(res.data);
    setChaptersHasMore(res.data.length >= limit);
    return res.data;
  }, [chapters.length, comicId, onLoadChapters, setChapters, setChaptersHasMore, showToast]);

  return { handleLoadMoreChapters, reloadLoadedChapters };
}

export function useInitialComicDetailChapters(args: Args): void {
  const {
    comicId,
    initialChapterId,
    pinnedChapterId,
    setChapters,
    setSelectedChapterId,
    setChaptersHasMore,
    setIsChaptersLoading,
    onLoadChapters,
    showToast,
  } = args;
  useEffect(() => {
    let cancelled = false;
    void loadInitialChapters(
      {
        comicId,
        initialChapterId,
        pinnedChapterId,
        setChapters,
        setSelectedChapterId,
        setChaptersHasMore,
        setIsChaptersLoading,
        onLoadChapters,
        showToast,
      },
      () => cancelled,
    );
    return () => {
      cancelled = true;
    };
  }, [
    comicId,
    initialChapterId,
    onLoadChapters,
    pinnedChapterId,
    setChapters,
    setChaptersHasMore,
    setIsChaptersLoading,
    setSelectedChapterId,
    showToast,
  ]);
}
