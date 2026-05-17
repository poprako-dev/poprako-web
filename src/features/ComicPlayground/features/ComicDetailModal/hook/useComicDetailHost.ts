import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { ToastType } from "@/components/ui/NotificationToast";
import type { ChapterInfo, ComicInfo } from "@/types";
import type { Result } from "@/types/utils/result";

type ShowToast = (message: string, type: ToastType) => void;

type Args = {
  returnTo: string;
  logPrefix: string;
  showToast: ShowToast;
  restoreComic: (comicId: string) => Promise<Result<ComicInfo>>;
  loadPinnedChapter: (comicInfo: ComicInfo) => Promise<Result<ChapterInfo | null>>;
};

export function useComicDetailHost({
  returnTo,
  logPrefix,
  showToast,
  restoreComic,
  loadPinnedChapter,
}: Args) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedComic, setSelectedComic] = useState<ComicInfo | null>(null);
  const [selectedComicPinnedChapter, setSelectedComicPinnedChapter] =
    useState<ChapterInfo | null>(null);
  const userClosedRef = useRef(false);

  const urlComicId = searchParams.get("comicId");
  const urlChapterId = searchParams.get("chapterId");

  const setComicDetailSearchParams = useCallback(
    (comicId: string | null, chapterId: string | null) => {
      const next = new URLSearchParams(searchParams);

      if (comicId) {
        next.set("comicId", comicId);
      } else {
        next.delete("comicId");
      }

      if (comicId && chapterId) {
        next.set("chapterId", chapterId);
      } else {
        next.delete("chapterId");
      }

      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const openComicDetail = useCallback(
    (comicInfo: ComicInfo, desiredChapterId?: string | null) => {
      setSelectedComic(comicInfo);
      setSelectedComicPinnedChapter(null);
      setComicDetailSearchParams(comicInfo.id, desiredChapterId ?? null);

      loadPinnedChapter(comicInfo).then((result) => {
        if (!result.success) {
          showToast(result.error, "error");
          return;
        }

        setSelectedComicPinnedChapter(result.data);
        if (!desiredChapterId) {
          setComicDetailSearchParams(comicInfo.id, result.data?.id ?? null);
        }
      });
    },
    [loadPinnedChapter, setComicDetailSearchParams, showToast],
  );

  const clearComicDetail = useCallback(
    (markUserClosed = false) => {
      userClosedRef.current = markUserClosed;
      setSelectedComic(null);
      setSelectedComicPinnedChapter(null);
      setComicDetailSearchParams(null, null);
    },
    [setComicDetailSearchParams],
  );

  useEffect(() => {
    if (!urlComicId || selectedComic?.id === urlComicId || userClosedRef.current) {
      userClosedRef.current = false;
      return;
    }

    let cancelled = false;

    restoreComic(urlComicId)
      .then((result) => {
        if (!result.success) {
          showToast(result.error, "error");
          if (!cancelled) {
            setComicDetailSearchParams(null, null);
          }
          return;
        }

        if (!cancelled) {
          openComicDetail(result.data, urlChapterId);
        }
      })
      .catch((err) => {
        console.error(`[${logPrefix}] 恢复漫画详情失败:`, err);
        showToast("恢复漫画详情失败", "error");
        if (!cancelled) {
          setComicDetailSearchParams(null, null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    logPrefix,
    openComicDetail,
    restoreComic,
    selectedComic?.id,
    setComicDetailSearchParams,
    showToast,
    urlChapterId,
    urlComicId,
  ]);

  const navigateToTranslator = useCallback(
    (chapterId: string, pageId: string, readOnly?: boolean) => {
      if (!selectedComic?.id) {
        navigate(`/translator/${chapterId}/${pageId}`);
        return;
      }

      const nextSearchParams = new URLSearchParams({
        returnTo,
        comicId: selectedComic.id,
        chapterId,
      });

      if (readOnly) {
        nextSearchParams.set("readOnly", "true");
      }

      navigate({
        pathname: `/translator/${chapterId}/${pageId}`,
        search: `?${nextSearchParams.toString()}`,
      });
    },
    [navigate, returnTo, selectedComic?.id],
  );

  return {
    selectedComic,
    selectedComicPinnedChapter,
    urlChapterId,
    openComicDetail,
    clearComicDetail,
    navigateToTranslator,
  };
}
