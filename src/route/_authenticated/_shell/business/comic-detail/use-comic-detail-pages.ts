import { useCallback, useMemo, useState } from "react";
import { showLocalApiFailure, showLocalCaughtError } from "@/route/business/request-error";
import type { ChapterInfo } from "@/route/_authenticated/business/chapter/chapter";
import type { PageInfo } from "@/route/_authenticated/business/page/page";
import type { ToastType } from "@/shared/component/notification-toast/notification-toast-type";
import type { DetailContract } from "@/route/_authenticated/_shell/business/comic-detail/comic-detail-type";
import {
  startChapterPageUpload,
  startPageReupload,
} from "@/route/_authenticated/_shell/business/comic-detail/upload/page-upload";
import {
  clearChapterUploadTasks,
  type PageUploadTaskStatus,
  type PageUploadTaskView,
  usePageUploadTaskStore,
} from "@/route/_authenticated/_shell/business/comic-detail/upload/page-upload-store";
import { usePageResults } from "./use-page-results";
import { useApiClient } from "@/route/business/api-context";

type ShowToast = (message: string, type: ToastType) => void;

type Args = {
  chapterId: string | null;
  comicId: string;
  isSelectedChapterAvailable: boolean;
  onLoadPages: DetailContract["onLoadPages"];
  onLoadChapters: DetailContract["onLoadChapters"];
  onDeleteChapterPages?: DetailContract["onDeleteChapterPages"] | undefined;
  reloadLoadedChapters: () => Promise<ChapterInfo[] | null>;
  showToast: ShowToast;
};

type PageState = {
  pages: PageInfo[];
  isPagesLoading: boolean;
  uploadProgressByPageId: Record<string, number>;
  uploadStatusByPageId: Record<string, PageUploadTaskStatus>;
  uploadErrorByPageId: Record<string, string>;
  reuploadingPageIds: Record<string, boolean>;
  isDeletingChapterPages: boolean;
  pageRecoveryNeeded: boolean;
  chapterStatsRecoveryNeeded: boolean;
  retryChapterStats: () => Promise<void>;
  reloadCurrentPages: () => Promise<void>;
  reloadChapterStats: () => Promise<ChapterInfo[] | null>;
  handleAddRawPages: (files: File[]) => Promise<void>;
  handleDeleteAllChapterPages: () => Promise<void>;
  handleReuploadPage: (pageId: string, file: File) => Promise<void>;
};

function isActiveTask(status: PageUploadTaskStatus): boolean {
  return ["preparing", "queued", "uploading", "confirming"].includes(status);
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
  isSelectedChapterAvailable,
  onLoadPages,
  onLoadChapters,
  onDeleteChapterPages,
  reloadLoadedChapters,
  showToast,
}: Args): PageState {
  const client = useApiClient();
  const [deletion, setDeletion] = useState<{ isCurrent: () => boolean } | null>(null);
  const isDeletingChapterPages = deletion?.isCurrent() ?? false;
  const [statsRecovery, setStatsRecovery] = useState<{ isCurrent: () => boolean } | null>(null);
  const chapterStatsRecoveryNeeded = statsRecovery?.isCurrent() ?? false;
  const uploadTasks = usePageUploadTaskStore((state) => state.tasks);
  const taskByPageId = useMemo(
    () => latestTasksByPage(uploadTasks, chapterId),
    [chapterId, uploadTasks],
  );
  const results = usePageResults({
    client,
    chapterId,
    available: isSelectedChapterAvailable,
    tasks: taskByPageId,
    onLoadPages,
    showToast,
  });
  const { serverPages, isPagesLoading, reloadCurrentPages, capture } = results;

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
      if (!task.pageId || serverPageIds.has(task.pageId) || task.index === null) continue;
      merged.push({
        id: task.pageId,
        chapterId: task.chapterId,
        index: task.index,
        imageUrl: "",
        isUploaded: task.status === "succeeded",
        totalUnitCount: 0,
        translatedUnitCount: 0,
        proofreadUnitCount: 0,
        createdAt: 0,
        updatedAt: 0,
      });
    }

    return [...merged].sort((left, right) => left.index - right.index);
  }, [serverPages, taskByPageId]);

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
    async (files: File[]): Promise<void> => {
      if (!chapterId) return;

      const isCurrent = capture();
      try {
        const started = await startChapterPageUpload(client, chapterId, files);
        if (isCurrent() && started.skippedCount > 0) {
          showToast(
            `已跳过 ${String(started.skippedCount)} 张重复图片，` +
              `开始上传 ${String(started.allocatedCount)} 张`,
            "info",
          );
        }

        void started.completion.then((summary) => {
          if (!isCurrent()) return;
          const unreportedFailures = summary.failed - summary.reportedValidationFailures;
          if (unreportedFailures > 0) {
            showToast(`${String(unreportedFailures)} 张图片上传失败，可在对应页面重传`, "error");
          }
        });
      } catch (error) {
        if (!isCurrent()) return;
        console.error("[ComicDetailModal] 分配页面失败:", error);
        showLocalCaughtError(error, showToast, "分配页面失败", true);
      }
    },
    [chapterId, client, capture, showToast],
  );

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

  const handleDeleteAllChapterPages = useCallback(async () => {
    if (!chapterId || !onDeleteChapterPages || isDeletingChapterPages) return;

    const isCurrent = capture();
    const isSameSession = results.captureSession();
    const request = { isCurrent };
    setDeletion(request);
    try {
      const res = await onDeleteChapterPages(chapterId);
      if (!res.success) {
        if (isCurrent()) {
          console.error("[ComicDetailModal] 批量删除页面失败", { chapterId, result: res });
          showLocalApiFailure(res, showToast);
        }
        return;
      }
      if (!isSameSession()) return;
      clearChapterUploadTasks(chapterId);
      if (!isCurrent()) return;
      setDeletion((current) => (current === request ? null : current));
      results.clear();
      const isClearedOwnerCurrent = results.capture();
      const refreshed = await refreshChapterStats();
      if (refreshed && isClearedOwnerCurrent()) showToast("页面已清空", "success");
    } catch (error) {
      if (isCurrent()) {
        console.error("[ComicDetailModal] 批量删除页面异常", { chapterId, error });
        showLocalCaughtError(error, showToast, "清空页面失败");
      }
    } finally {
      if (isCurrent()) setDeletion((current) => (current === request ? null : current));
    }
  }, [
    chapterId,
    onDeleteChapterPages,
    refreshChapterStats,
    showToast,
    results,
    isDeletingChapterPages,
    capture,
  ]);

  const handleReuploadPage = useCallback(
    async (pageId: string, file: File) => {
      if (!chapterId || reuploadingPageIds[pageId] === true) return;

      const isCurrent = capture();
      try {
        const started = await startPageReupload(client, chapterId, pageId, file);
        void started.completion.then((summary) => {
          if (!isCurrent()) return;
          if (summary.succeeded > 0) {
            showToast("重上传成功", "success");
            return;
          }
          if (summary.reportedValidationFailures > 0) return;
          showToast("重上传失败，请检查对应页面", "error");
        });
      } catch (error) {
        if (!isCurrent()) return;
        console.error("[ComicDetailModal] 重上传分配失败:", error);
        showLocalCaughtError(error, showToast, "重上传失败", true);
      }
    },
    [chapterId, client, capture, reuploadingPageIds, showToast],
  );

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

  return {
    pages,
    isPagesLoading,
    uploadProgressByPageId,
    uploadStatusByPageId,
    uploadErrorByPageId,
    reuploadingPageIds,
    isDeletingChapterPages,
    reloadCurrentPages,
    pageRecoveryNeeded: results.pageRecoveryNeeded,
    chapterStatsRecoveryNeeded,
    retryChapterStats,
    reloadChapterStats,
    handleAddRawPages,
    handleDeleteAllChapterPages,
    handleReuploadPage,
  };
}
