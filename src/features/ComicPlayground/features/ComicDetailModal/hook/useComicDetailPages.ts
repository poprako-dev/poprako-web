import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PageInfo } from "@/types";
import type { ToastType } from "@/components/ui/NotificationToast";
import type { ComicDetailModalProps } from "../types";
import {
  startChapterPageUpload,
  startPageReupload,
} from "../pageUpload";
import {
  usePageUploadTaskStore,
  clearChapterUploadTasks,
  type PageUploadTaskStatus,
  type PageUploadTaskView,
} from "../pageUploadStore";
import { getPage } from "@/features/ComicPlayground/api/page";

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

function isActiveTask(status: PageUploadTaskStatus): boolean {
  return (
    status === "preparing"
    || status === "queued"
    || status === "uploading"
    || status === "confirming"
  );
}

function latestTasksByPage(
  tasks: Record<string, PageUploadTaskView>,
  chapterId: string | null,
): Map<string, PageUploadTaskView> {
  const latest = new Map<string, PageUploadTaskView>();
  for (const task of Object.values(tasks)) {
    if (task.chapterId !== chapterId || !task.pageId) continue;
    latest.set(task.pageId, task);
  }
  return latest;
}

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
  const [serverPages, setServerPages] = useState<PageInfo[]>([]);
  const [isDeletingChapterPages, setIsDeletingChapterPages] = useState(false);
  const uploadTasks = usePageUploadTaskStore((state) => state.tasks);
  const taskByPageId = useMemo(
    () => latestTasksByPage(uploadTasks, chapterId),
    [chapterId, uploadTasks],
  );

  useEffect(() => {
    if (chapterId && isSelectedChapterAvailable) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setServerPages([]);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [chapterId, isSelectedChapterAvailable]);

  useEffect(() => {
    if (!chapterId || !isSelectedChapterAvailable) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setServerPages([]);
    /* eslint-enable react-hooks/set-state-in-effect */
    onLoadPages(chapterId)
      .then((res) => {
        if (!res.success) {
          console.error("[ComicDetailModal] 加载页面失败:", res);
          showToast("加载页面失败", "error");
          return;
        }
        setServerPages(res.data);
      })
      .catch((error) => {
        console.error("[ComicDetailModal] 加载页面异常:", error);
        showToast("加载页面失败", "error");
      });
  }, [chapterId, isSelectedChapterAvailable, onLoadPages, showToast]);

  const fetchedTaskIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!chapterId) return;

    for (const task of taskByPageId.values()) {
      if (task.status !== "succeeded" || !task.pageId) continue;
      if (fetchedTaskIdsRef.current.has(task.taskId)) continue;

      fetchedTaskIdsRef.current.add(task.taskId);

      getPage(task.pageId).then((res) => {
        if (!res.success) return;
        setServerPages((prev) => {
          const idx = prev.findIndex((p) => p.id === task.pageId);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = res.data;
            return next;
          }
          return [...prev, res.data];
        });
      });
    }
  }, [chapterId, taskByPageId]);

  const reloadCurrentPages = useCallback(async () => {
    if (!chapterId) return;
    const res = await onLoadPages(chapterId);
    if (!res.success) {
      showToast(res.error, "error");
      return;
    }
    setServerPages(res.data);
  }, [chapterId, onLoadPages, showToast]);

  const pages = useMemo(() => {
    const merged = serverPages.map((page) => {
      const task = taskByPageId.get(page.id);
      if (task?.status === "succeeded" && !page.isUploaded) {
        return { ...page, isUploaded: true };
      }
      return page;
    });
    const serverPageIds = new Set(serverPages.map((page) => page.id));

    for (const task of taskByPageId.values()) {
      if (serverPageIds.has(task.pageId!) || task.index === null) continue;
      merged.push({
        id: task.pageId!,
        chapterId: task.chapterId,
        index: task.index,
        imageUrl: "",
        isUploaded: task.status === "succeeded",
        creatorId: currentUserId ?? "",
        totalUnitCount: 0,
        translatedUnitCount: 0,
        proofreadUnitCount: 0,
        createdAt: 0,
        updatedAt: 0,
      });
    }

    return merged.sort((left, right) => left.index - right.index);
  }, [currentUserId, serverPages, taskByPageId]);

  const uploadProgressByPageId = useMemo(() => {
    const progress: Record<string, number> = {};
    for (const [pageId, task] of taskByPageId) {
      if (isActiveTask(task.status)) progress[pageId] = task.progress;
    }
    return progress;
  }, [taskByPageId]);

  const uploadStatusByPageId = useMemo(() => {
    const statuses: Record<string, PageUploadTaskStatus> = {};
    for (const [pageId, task] of taskByPageId) {
      statuses[pageId] = task.status;
    }
    return statuses;
  }, [taskByPageId]);

  const uploadErrorByPageId = useMemo(() => {
    const errors: Record<string, string> = {};
    for (const [pageId, task] of taskByPageId) {
      if (task.status === "failed" && task.error) errors[pageId] = task.error;
    }
    return errors;
  }, [taskByPageId]);

  const reuploadingPageIds = useMemo(() => {
    const active: Record<string, boolean> = {};
    for (const [pageId, task] of taskByPageId) {
      if (isActiveTask(task.status)) active[pageId] = true;
    }
    return active;
  }, [taskByPageId]);

  const handleAddRawPages = useCallback(
    async (files: File[]) => {
      if (!chapterId || !onAddPages) return;

      try {
        const started = await startChapterPageUpload(chapterId, files);
        if (started.skippedCount > 0) {
          showToast(
            `已跳过 ${started.skippedCount} 张重复图片，`
              + `开始上传 ${started.reservedCount} 张`,
            "info",
          );
        }

        void started.completion.then((summary) => {
          if (summary.failed > 0) {
            showToast(
              `${summary.failed} 张图片上传失败，可在对应页面重传`,
              "error",
            );
          }
        });
      } catch (error) {
        console.error("[ComicDetailModal] 预留页面失败:", error);
        showToast(error instanceof Error ? error.message : "预留页面失败", "error");
      }
    },
    [chapterId, onAddPages, showToast],
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

    setServerPages([]);
    clearChapterUploadTasks(chapterId);
    await reloadLoadedChapters();
    showToast("页面已清空", "success");
  }, [
    chapterId,
    onDeleteChapterPages,
    reloadLoadedChapters,
    showToast,
  ]);

  const handleReuploadPage = useCallback(
    async (pageId: string, file: File) => {
      if (!chapterId || !onReservePageUpload || reuploadingPageIds[pageId]) return;

      try {
        const started = await startPageReupload(chapterId, pageId, file);
        void started.completion.then((summary) => {
          if (summary.succeeded > 0) {
            showToast("重上传成功", "success");
            return;
          }
          showToast("重上传失败，请检查对应页面", "error");
        });
      } catch (error) {
        console.error("[ComicDetailModal] 重上传预留失败:", error);
        showToast(error instanceof Error ? error.message : "重上传失败", "error");
      }
    },
    [
      chapterId,
      onReservePageUpload,
      reuploadingPageIds,
      showToast,
    ],
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
    uploadProgressByPageId,
    uploadStatusByPageId,
    uploadErrorByPageId,
    reuploadingPageIds,
    isDeletingChapterPages,
    reloadCurrentPages,
    reloadChapterStats,
    handleAddRawPages,
    handleDeleteAllChapterPages,
    handleReuploadPage,
  };
}
