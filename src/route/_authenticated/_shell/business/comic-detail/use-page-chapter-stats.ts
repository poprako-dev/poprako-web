import { useCallback, useState } from "react";
import { showLocalApiFailure, showLocalCaughtError } from "@/route/business/request-error";

import type { usePageResults } from "./use-page-results";

import type { ComicDetailPagesArgs as Args, PageState } from "./use-comic-detail-pages";
type Results = ReturnType<typeof usePageResults>;

type StatsRecovery = {
  chapterStatsRecoveryNeeded: boolean;
  refreshChapterStats: () => Promise<boolean>;
  retryChapterStats: () => Promise<void>;
};

export function useChapterStatsRecovery(args: Args, capture: Results["capture"]): StatsRecovery {
  const { chapterId, reloadLoadedChapters, showToast } = args;
  const [statsRecovery, setStatsRecovery] = useState<{ isCurrent: () => boolean } | null>(null);
  const chapterStatsRecoveryNeeded = statsRecovery?.isCurrent() ?? false;
  const refreshChapterStats = useCallback(async (): Promise<boolean> => {
    const isCurrent = capture();
    try {
      const chapters = await reloadLoadedChapters();
      if (!isCurrent()) return false;
      if (chapters === null) {
        setStatsRecovery({ isCurrent });
        return false;
      }
      setStatsRecovery(null);
      return true;
    } catch (error) {
      if (!isCurrent()) return false;
      console.error("[ComicDetailModal] 清空后刷新章节统计异常", { chapterId, error });
      setStatsRecovery({ isCurrent });
      showLocalCaughtError(error, showToast, "页面已清空，但章节统计刷新失败，请重新加载章节信息");
      return false;
    }
  }, [capture, chapterId, reloadLoadedChapters, showToast]);
  const retryChapterStats = useCallback(async (): Promise<void> => {
    await refreshChapterStats();
  }, [refreshChapterStats]);

  return { chapterStatsRecoveryNeeded, refreshChapterStats, retryChapterStats };
}

export function useReloadChapterStats(args: Args): PageState["reloadChapterStats"] {
  const { comicId, onLoadChapters, showToast } = args;
  const reloadChapterStats = useCallback(async () => {
    const res = await onLoadChapters({
      comicId,
      offset: 0,
      limit: 20,
    });

    if (!res.success) {
      showLocalApiFailure(res, showToast);
      return null;
    }

    return res.data;
  }, [comicId, onLoadChapters, showToast]);

  return reloadChapterStats;
}
