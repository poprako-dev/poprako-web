import { useCallback, useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { showLocalApiFailure, showLocalCaughtError } from "@/routes/business/request";
import type { ChapterInfo } from "@/routes/_authenticated/business/chapter/chapter";
import type { Result } from "@/shared/utility/result";
import type { ToastType } from "@/shared/component/notification-toast/notification-toast-type";
import type { ComicDetailModalProps } from "@/routes/_authenticated/_shell/business/comic-detail/comic-detail-type";
import { pickFallbackChapterId } from "@/routes/_authenticated/_shell/business/comic-detail/utils";

type ShowToast = (message: string, type: ToastType) => void;

type Args = {
  comicId: string;
  pinnedChapter: ChapterInfo | null;
  initialChapterId?: string | null | undefined;
  onLoadChapters: ComicDetailModalProps["onLoadChapters"];
  showToast: ShowToast;
};

type ChapterState = {
  chapters: ChapterInfo[];
  setChapters: Dispatch<SetStateAction<ChapterInfo[]>>;
  selectedChapter: ChapterInfo | undefined;
  selectedChapterId: string | null;
  setSelectedChapterId: Dispatch<SetStateAction<string | null>>;
  chaptersHasMore: boolean;
  isChaptersLoading: boolean;
  isSelectedChapterAvailable: boolean;
  handleLoadMoreChapters: () => void;
  reloadLoadedChapters: () => Promise<ChapterInfo[] | null>;
  handleCreateChapter: (
    subtitle: string | undefined,
    presetAssignmentRoles: number | undefined,
    onCreateChapter?: ComicDetailModalProps["onCreateChapter"],
  ) => Promise<Result<string>>;
  handleDeleteChapter: (
    chapterId: string,
    onDeleteChapter?: ComicDetailModalProps["onDeleteChapter"],
  ) => Promise<void>;
  chaptersLimit: number;
};

const CHAPTERS_LIMIT = 20;

export function useComicDetailChapters({
  comicId,
  pinnedChapter,
  initialChapterId,
  onLoadChapters,
  showToast,
}: Args): ChapterState {
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
    let isCancelled = false;

    const loadInitialChapters = async (): Promise<void> => {
      setIsChaptersLoading(true);

      try {
        let offset = 0;
        let hasMore = true;
        const loadedChapters: ChapterInfo[] = [];

        for (;;) {
          const res = await onLoadChapters({
            comicId,
            offset,
            limit: CHAPTERS_LIMIT,
          });

          if (!res.success) {
            console.error("[ComicDetailModal] 加载章节失败:", res);
            showLocalApiFailure(res, showToast, "加载章节失败");
            return;
          }

          loadedChapters.push(...res.data);
          hasMore = res.data.length === CHAPTERS_LIMIT;

          if (
            !hasMore ||
            !initialChapterId ||
            loadedChapters.some((chapter) => chapter.id === initialChapterId)
          ) {
            if (!isCancelled) {
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
      } catch (error) {
        console.error("[ComicDetailModal] 加载章节异常:", error);
        showLocalCaughtError(error, showToast, "加载章节失败");
      } finally {
        if (!isCancelled) {
          setIsChaptersLoading(false);
        }
      }
    };

    void loadInitialChapters();

    return () => {
      isCancelled = true;
    };
  }, [comicId, initialChapterId, onLoadChapters, pinnedChapter?.id, showToast]);

  const handleLoadMoreChapters = useCallback((): void => {
    if (isChaptersLoading || !chaptersHasMore) return;
    setIsChaptersLoading(true);
    const loadMoreChapters = async (): Promise<void> => {
      try {
        const res = await onLoadChapters({
          comicId,
          offset: chapters.length,
          limit: CHAPTERS_LIMIT,
        });
        if (!res.success) {
          showLocalApiFailure(res, showToast, "加载更多章节失败");
          return;
        }
        setChapters((prev) => [...prev, ...res.data]);
        setChaptersHasMore(res.data.length === CHAPTERS_LIMIT);
      } catch (error) {
        showLocalCaughtError(error, showToast, "加载更多章节失败");
      } finally {
        setIsChaptersLoading(false);
      }
    };
    void loadMoreChapters();
  }, [chapters.length, chaptersHasMore, comicId, isChaptersLoading, onLoadChapters, showToast]);

  const reloadLoadedChapters = useCallback(async () => {
    const res = await onLoadChapters({
      comicId,
      offset: 0,
      limit: Math.max(chapters.length, CHAPTERS_LIMIT),
    });

    if (!res.success) {
      console.error("[ComicDetailModal] 刷新章节失败:", res);
      showLocalApiFailure(res, showToast, "刷新章节失败");
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
    async (chapterId: string, onDeleteChapter?: ComicDetailModalProps["onDeleteChapter"]) => {
      if (!onDeleteChapter) {
        return;
      }

      const res = await onDeleteChapter(chapterId);
      if (!res.success) {
        showLocalApiFailure(res, showToast, "删除失败");
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
        showLocalApiFailure(reloaded, showToast, "刷新章节失败");
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
