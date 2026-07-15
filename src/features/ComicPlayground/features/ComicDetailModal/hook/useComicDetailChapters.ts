import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChapterInfo } from "@/types";
import type { Result } from "@/types/utils/result";
import type { ToastType } from "@/components/ui/NotificationToast";
import type { ComicDetailModalProps } from "../types";
import { pickFallbackChapterId } from "../utils";

type ShowToast = (message: string, type: ToastType) => void;

type Args = {
  comicId: string;
  pinnedChapter: ChapterInfo | null;
  initialChapterId?: string | null;
  onLoadChapters: ComicDetailModalProps["onLoadChapters"];
  showToast: ShowToast;
};

const CHAPTERS_LIMIT = 20;

export function useComicDetailChapters({
  comicId,
  pinnedChapter,
  initialChapterId,
  onLoadChapters,
  showToast,
}: Args) {
  const [chapters, setChapters] = useState<ChapterInfo[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(
    initialChapterId ?? pinnedChapter?.id ?? null,
  );
  const [chaptersHasMore, setChaptersHasMore] = useState(true);
  const [isChaptersLoading, setIsChaptersLoading] = useState(false);

  const selectedChapter = useMemo(
    () =>
      chapters.find((chapter) => chapter.id === selectedChapterId) ??
      (pinnedChapter?.id === selectedChapterId ? pinnedChapter : undefined),
    [chapters, pinnedChapter, selectedChapterId],
  );

  const isSelectedChapterAvailable =
    selectedChapterId !== null &&
    (chapters.some((chapter) => chapter.id === selectedChapterId) ||
      pinnedChapter?.id === selectedChapterId);

  useEffect(() => {
    let cancelled = false;

    const loadInitialChapters = async () => {
      setIsChaptersLoading(true);

      try {
        let offset = 0;
        let hasMore = true;
        const loadedChapters: ChapterInfo[] = [];

        while (hasMore) {
          const res = await onLoadChapters({
            comicId,
            offset,
            limit: CHAPTERS_LIMIT,
          });

          if (!res.success) {
            console.error("[ComicDetailModal] 加载章节失败:", res);
            showToast("加载章节失败", "error");
            return;
          }

          loadedChapters.push(...res.data);
          hasMore = res.data.length === CHAPTERS_LIMIT;

          if (
            !initialChapterId ||
            loadedChapters.some((chapter) => chapter.id === initialChapterId) ||
            !hasMore
          ) {
            if (!cancelled) {
              setChapters(loadedChapters);
              setChaptersHasMore(hasMore);
              setSelectedChapterId(() => {
                if (
                  initialChapterId &&
                  loadedChapters.some((chapter) => chapter.id === initialChapterId)
                ) {
                  return initialChapterId;
                }
                if (
                  pinnedChapter?.id &&
                  loadedChapters.some((chapter) => chapter.id === pinnedChapter.id)
                ) {
                  return pinnedChapter.id;
                }
                return loadedChapters[0]?.id ?? null;
              });
            }
            return;
          }

          offset += res.data.length;
        }

        if (!cancelled) {
          setChapters(loadedChapters);
          setChaptersHasMore(false);
          setSelectedChapterId(loadedChapters[0]?.id ?? null);
        }
      } catch (err) {
        console.error("[ComicDetailModal] 加载章节异常:", err);
        showToast("加载章节失败", "error");
      } finally {
        if (!cancelled) {
          setIsChaptersLoading(false);
        }
      }
    };

    void loadInitialChapters();

    return () => {
      cancelled = true;
    };
  }, [comicId, initialChapterId, onLoadChapters, pinnedChapter?.id, showToast]);

  const handleLoadMoreChapters = useCallback(() => {
    if (isChaptersLoading || !chaptersHasMore) return;
    setIsChaptersLoading(true);
    onLoadChapters({
      comicId,
      offset: chapters.length,
      limit: CHAPTERS_LIMIT,
    })
      .then((res) => {
        if (!res.success) {
          showToast("加载更多章节失败", "error");
          return;
        }
        setChapters((prev) => [...prev, ...res.data]);
        setChaptersHasMore(res.data.length === CHAPTERS_LIMIT);
      })
      .catch(() => showToast("加载更多章节失败", "error"))
      .finally(() => setIsChaptersLoading(false));
  }, [chapters.length, chaptersHasMore, comicId, isChaptersLoading, onLoadChapters, showToast]);

  const reloadLoadedChapters = useCallback(async () => {
    const res = await onLoadChapters({
      comicId,
      offset: 0,
      limit: Math.max(chapters.length, CHAPTERS_LIMIT),
    });

    if (!res.success) {
      console.error("[ComicDetailModal] 刷新章节失败:", res);
      showToast("刷新章节失败", "error");
      return null;
    }

    setChapters(res.data);
    setChaptersHasMore(res.data.length >= Math.max(chapters.length, CHAPTERS_LIMIT));
    return res.data;
  }, [chapters.length, comicId, onLoadChapters, showToast]);

  const handleCreateChapter = useCallback(
    async (
      subtitle: string | undefined,
      presetAssignmentRoles: number | undefined,
      onCreateChapter?: ComicDetailModalProps["onCreateChapter"],
    ): Promise<Result<string>> => {
      if (!onCreateChapter) {
        return { success: false, error: "未提供创建章节能力" };
      }

      const res = await onCreateChapter({
        comicId,
        subtitle,
        presetAssignmentRoles,
      });
      if (!res.success) {
        return res;
      }

      const reloaded = await onLoadChapters({
        comicId,
        offset: 0,
        limit: CHAPTERS_LIMIT,
      });
      if (reloaded.success) {
        setChapters(reloaded.data);
        setSelectedChapterId(reloaded.data[0]?.id ?? null);
      }

      return res;
    },
    [comicId, onLoadChapters],
  );

  const handleDeleteChapter = useCallback(
    async (
      chapterId: string,
      onDeleteChapter?: ComicDetailModalProps["onDeleteChapter"],
    ) => {
      if (!onDeleteChapter) {
        return;
      }

      const res = await onDeleteChapter(chapterId);
      if (!res.success) {
        showToast("删除失败", "error");
        return;
      }

      if (selectedChapterId === chapterId) {
        const reloaded = await onLoadChapters({
          comicId,
          offset: 0,
          limit: CHAPTERS_LIMIT,
        });
        if (reloaded.success) {
          setChapters(reloaded.data);
          setSelectedChapterId(pickFallbackChapterId(reloaded.data));
          return;
        }
        showToast("刷新章节失败", "error");
      }

      setChapters((prev) => prev.filter((chapter) => chapter.id !== chapterId));
      if (selectedChapterId === chapterId) {
        setSelectedChapterId(null);
      }
    },
    [comicId, onLoadChapters, selectedChapterId, showToast],
  );

  return {
    chapters,
    setChapters,
    selectedChapter,
    selectedChapterId,
    setSelectedChapterId,
    chaptersHasMore,
    isChaptersLoading,
    isSelectedChapterAvailable,
    handleLoadMoreChapters,
    reloadLoadedChapters,
    handleCreateChapter,
    handleDeleteChapter,
    chaptersLimit: CHAPTERS_LIMIT,
  };
}
