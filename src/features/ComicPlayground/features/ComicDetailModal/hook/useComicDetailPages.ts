import { useCallback, useEffect, useState } from "react";
import { updatePage, uploadToPresignedUrl } from "@/features/ComicPlayground/api/page";
import type { PageInfo, UploadProgressCallbacks } from "@/types";
import type { ToastType } from "@/components/ui/NotificationToast";
import type { ComicDetailModalProps } from "../types";
import { getFileExtension } from "../utils";

type ShowToast = (message: string, type: ToastType) => void;

type Args = {
  chapterId: string | null;
  comicId: string;
  currentUserId?: string | null;
  isSelectedChapterAvailable: boolean;
  onLoadPages: ComicDetailModalProps["onLoadPages"];
  onLoadChapters: ComicDetailModalProps["onLoadChapters"];
  onAddPages?: ComicDetailModalProps["onAddPages"];
  onDeleteChapterPages?: ComicDetailModalProps["onDeleteChapterPages"];
  onReservePageUpload?: ComicDetailModalProps["onReservePageUpload"];
  reloadLoadedChapters: () => Promise<unknown>;
  showToast: ShowToast;
};

export function useComicDetailPages({
  chapterId,
  comicId,
  currentUserId,
  isSelectedChapterAvailable,
  onLoadPages,
  onLoadChapters,
  onAddPages,
  onDeleteChapterPages,
  onReservePageUpload,
  reloadLoadedChapters,
  showToast,
}: Args) {
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [reuploadingPageIds, setReuploadingPageIds] = useState<Record<string, boolean>>({});
  const [uploadProgressByPageId, setUploadProgressByPageId] = useState<Record<string, number>>(
    {},
  );
  const [isDeletingChapterPages, setIsDeletingChapterPages] = useState(false);

  useEffect(() => {
    if (chapterId && isSelectedChapterAvailable) return;
    setPages([]);
    setUploadProgressByPageId({});
  }, [chapterId, isSelectedChapterAvailable]);

  useEffect(() => {
    if (!chapterId || !isSelectedChapterAvailable) return;
    setPages([]);
    setUploadProgressByPageId({});
    onLoadPages(chapterId)
      .then((res) => {
        if (!res.success) {
          console.error("[ComicDetailModal] 加载页面失败:", res);
          showToast("加载页面失败", "error");
          return;
        }
        setPages(res.data);
      })
      .catch((err) => {
        console.error("[ComicDetailModal] 加载页面异常:", err);
        showToast("加载页面失败", "error");
      });
  }, [chapterId, isSelectedChapterAvailable, onLoadPages, showToast]);

  const reloadCurrentPages = useCallback(async () => {
    if (!chapterId) return;
    const res = await onLoadPages(chapterId);
    if (!res.success) {
      showToast(res.error, "error");
      return;
    }
    setPages(res.data);
    setUploadProgressByPageId({});
  }, [chapterId, onLoadPages, showToast]);

  const handleAddRawPages = useCallback(
    async (files: File[]) => {
      if (!chapterId || !onAddPages) return;

      const blobUrls: string[] = [];
      const tempPageIds = files.map(
        (_, index) =>
          `tmp-page-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
      );
      const pendingPageIds = new Set<string>(tempPageIds);
      const startIndex = pages.length;

      const tempPages: PageInfo[] = tempPageIds.map((tempId, index) => ({
        id: tempId,
        chapterId,
        index: startIndex + index,
        imageUrl: "",
        isUploaded: false,
        creatorId: currentUserId ?? "",
        totalUnitCount: 0,
        translatedUnitCount: 0,
        proofreadUnitCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }));
      setPages((prev) => [...prev, ...tempPages]);
      setUploadProgressByPageId((prev) => {
        const next = { ...prev };
        for (const tempId of tempPageIds) next[tempId] = 0;
        return next;
      });

      const callbacks: UploadProgressCallbacks = {
        onPagesReserved: (pendingPages) => {
          pendingPageIds.clear();
          for (let i = 0; i < pendingPages.length; i++) {
            pendingPageIds.add(pendingPages[i].pageId);
          }

          setPages((prev) => {
            const idMap = new Map<string, string>();
            for (let i = 0; i < pendingPages.length; i++) {
              const tempId = tempPageIds[i];
              const reservedPageId = pendingPages[i].pageId;
              if (tempId) idMap.set(tempId, reservedPageId);
            }

            return prev.map((page) => {
              const reservedPageId = idMap.get(page.id);
              if (!reservedPageId) return page;
              return { ...page, id: reservedPageId };
            });
          });

          setUploadProgressByPageId((prev) => {
            const next = { ...prev };
            for (let i = 0; i < pendingPages.length; i++) {
              const tempId = tempPageIds[i];
              const reservedPageId = pendingPages[i].pageId;
              if (!tempId) continue;
              next[reservedPageId] = next[tempId] ?? 0;
              delete next[tempId];
            }
            return next;
          });
        },
        onPageUploadProgress: (pageId, percent) => {
          setUploadProgressByPageId((prev) => ({ ...prev, [pageId]: percent }));
        },
        onPageUploaded: (pageId, file) => {
          const blobUrl = URL.createObjectURL(file);
          blobUrls.push(blobUrl);
          setUploadProgressByPageId((prev) => {
            if (!(pageId in prev)) return prev;
            const next = { ...prev };
            delete next[pageId];
            return next;
          });
          setPages((prev) =>
            prev.map((page) =>
              page.id === pageId
                ? { ...page, imageUrl: blobUrl, isUploaded: true }
                : page,
            ),
          );
        },
      };

      try {
        await onAddPages(chapterId, files, callbacks);
        for (const url of blobUrls) URL.revokeObjectURL(url);
        setUploadProgressByPageId({});
        await Promise.all([reloadCurrentPages(), reloadLoadedChapters()]);
      } catch (err) {
        for (const url of blobUrls) URL.revokeObjectURL(url);
        setPages((prev) => prev.filter((page) => !pendingPageIds.has(page.id)));
        setUploadProgressByPageId((prev) => {
          const next = { ...prev };
          for (const pageId of pendingPageIds) delete next[pageId];
          for (const tempId of tempPageIds) delete next[tempId];
          return next;
        });
        console.error("[ComicDetailModal] 上传页面失败:", err);
        showToast(err instanceof Error ? err.message : "上传页面失败", "error");
      }
    },
    [chapterId, currentUserId, onAddPages, pages.length, reloadCurrentPages, reloadLoadedChapters, showToast],
  );

  const handleDeleteAllChapterPages = useCallback(async () => {
    if (!chapterId || !onDeleteChapterPages) return;

    setIsDeletingChapterPages(true);
    const res = await onDeleteChapterPages(chapterId);
    setIsDeletingChapterPages(false);

    if (!res.success) {
      console.error("[ComicDetailModal] 批量删除页面失败:", res);
      showToast(res.error, "error");
      return;
    }

    await Promise.all([reloadCurrentPages(), reloadLoadedChapters()]);
    showToast("页面已清空", "success");
  }, [chapterId, onDeleteChapterPages, reloadCurrentPages, reloadLoadedChapters, showToast]);

  const handleReuploadPage = useCallback(
    async (pageId: string, file: File) => {
      if (!onReservePageUpload || reuploadingPageIds[pageId]) return;

      const fileExtension = getFileExtension(file);
      if (!fileExtension) {
        showToast("请选择带后缀的图片文件", "error");
        return;
      }

      setReuploadingPageIds((prev) => ({ ...prev, [pageId]: true }));
      setUploadProgressByPageId((prev) => ({ ...prev, [pageId]: 0 }));
      try {
        const reserveResult = await onReservePageUpload({
          pageId,
          fileExtension,
        });
        if (!reserveResult.success) {
          console.error("[ComicDetailModal] 重上传预留失败:", reserveResult);
          showToast(reserveResult.error, "error");
          return;
        }

        const uploadResult = await uploadToPresignedUrl(
          reserveResult.data.putUrl,
          file,
          (percent) => {
            setUploadProgressByPageId((prev) => ({ ...prev, [pageId]: percent }));
          },
        );
        if (!uploadResult.success) {
          console.error("[ComicDetailModal] 重上传文件失败:", uploadResult.error);
          showToast(uploadResult.error, "error");
          return;
        }

        const markResult = await updatePage(reserveResult.data.pageId, {
          isUploaded: true,
        });
        if (!markResult.success) {
          console.error("[ComicDetailModal] 标记重上传状态失败:", markResult.error);
          showToast(markResult.error, "error");
          return;
        }

        await Promise.all([reloadCurrentPages(), reloadLoadedChapters()]);
        showToast("重上传成功", "success");
      } catch (err) {
        console.error("[ComicDetailModal] 重上传异常:", err);
        showToast(err instanceof Error ? err.message : "重上传失败", "error");
      } finally {
        setReuploadingPageIds((prev) => ({ ...prev, [pageId]: false }));
        setUploadProgressByPageId((prev) => {
          if (!(pageId in prev)) return prev;
          const next = { ...prev };
          delete next[pageId];
          return next;
        });
      }
    },
    [onReservePageUpload, reuploadingPageIds, reloadCurrentPages, reloadLoadedChapters, showToast],
  );

  const reloadChapterStats = useCallback(async () => {
    const res = await onLoadChapters({
      comicId,
      offset: 0,
      limit: 20,
    });

    if (!res.success) {
      showToast(res.error, "error");
      return null;
    }

    return res.data;
  }, [comicId, onLoadChapters, showToast]);

  return {
    pages,
    setPages,
    uploadProgressByPageId,
    setUploadProgressByPageId,
    reuploadingPageIds,
    isDeletingChapterPages,
    reloadCurrentPages,
    reloadChapterStats,
    handleAddRawPages,
    handleDeleteAllChapterPages,
    handleReuploadPage,
  };
}
