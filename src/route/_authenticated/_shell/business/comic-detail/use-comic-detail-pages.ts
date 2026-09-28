import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { getPage } from "@/route/_authenticated/business/page/page-request";
import { useApiClient } from "@/route/business/api-context";

type ShowToast = (message: string, type: ToastType) => void;

type Args = {
  chapterId: string | null;
  comicId: string;
  isSelectedChapterAvailable: boolean;
  onLoadPages: DetailContract["onLoadPages"];
  onLoadChapters: DetailContract["onLoadChapters"];
  onAddPages?: DetailContract["onAddPages"] | undefined;
  onDeleteChapterPages?: DetailContract["onDeleteChapterPages"] | undefined;
  onAllocPageUpload?: DetailContract["onAllocPageUpload"] | undefined;
  reloadLoadedChapters: () => Promise<unknown>;
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
  onAddPages,
  onDeleteChapterPages,
  onAllocPageUpload,
  reloadLoadedChapters,
  showToast,
}: Args): PageState {
  const client = useApiClient();
  const [serverPages, setServerPages] = useState<PageInfo[]>([]);
  const [isPagesLoading, setIsPagesLoading] = useState(false);
  const [isDeletingChapterPages, setIsDeletingChapterPages] = useState(false);
  const uploadTasks = usePageUploadTaskStore((state) => state.tasks);
  const taskByPageId = useMemo(
    () => latestTasksByPage(uploadTasks, chapterId),
    [chapterId, uploadTasks],
  );

  useEffect(() => {
    if (chapterId && isSelectedChapterAvailable) return;
    // eslint-disable-next-line @eslint-react/set-state-in-effect, react-hooks/set-state-in-effect
    setServerPages([]);
    setIsPagesLoading(false); // eslint-disable-line @eslint-react/set-state-in-effect
  }, [chapterId, isSelectedChapterAvailable]);

  useEffect(() => {
    if (!chapterId || !isSelectedChapterAvailable) return;
    let isCancelled = false;
    // eslint-disable-next-line @eslint-react/set-state-in-effect, react-hooks/set-state-in-effect
    setServerPages([]);
    setIsPagesLoading(true); // eslint-disable-line @eslint-react/set-state-in-effect
    const loadPages = async (): Promise<void> => {
      try {
        const res = await onLoadPages(chapterId);
        if (isCancelled) return;
        if (!res.success) {
          console.error("[ComicDetailModal] 加载页面失败:", res);
          showLocalApiFailure(res, showToast, "加载页面失败");
          return;
        }
        setServerPages(res.data);
      } catch (error) {
        if (isCancelled) return;
        console.error("[ComicDetailModal] 加载页面异常:", error);
        showLocalCaughtError(error, showToast, "加载页面失败");
      } finally {
        if (!isCancelled) setIsPagesLoading(false);
      }
    };
    void loadPages();

    return () => {
      isCancelled = true;
    };
  }, [chapterId, isSelectedChapterAvailable, onLoadPages, showToast]);

  const fetchedTaskIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!chapterId) return;

    const fetchSucceededPages = async (): Promise<void> => {
      for (const task of taskByPageId.values()) {
        if (task.status !== "succeeded" || !task.pageId) continue;
        if (fetchedTaskIdsRef.current.has(task.taskId)) continue;

        fetchedTaskIdsRef.current.add(task.taskId);

        const res = await getPage(client, task.pageId);
        if (!res.success) continue;
        setServerPages((prev) => {
          const idx = prev.findIndex((p) => p.id === task.pageId);
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = res.data;
            return next;
          }
          return [...prev, res.data];
        });
      }
    };
    void fetchSucceededPages();
  }, [client, chapterId, taskByPageId]);

  const reloadCurrentPages = useCallback(async () => {
    if (!chapterId) return;
    const res = await onLoadPages(chapterId);
    if (!res.success) {
      showLocalApiFailure(res, showToast);
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
      if (!chapterId || !onAddPages) return;

      try {
        const started = await startChapterPageUpload(client, chapterId, files);
        if (started.skippedCount > 0) {
          showToast(
            `已跳过 ${String(started.skippedCount)} 张重复图片，` +
              `开始上传 ${String(started.allocatedCount)} 张`,
            "info",
          );
        }

        void started.completion.then((summary) => {
          const unreportedFailures = summary.failed - summary.reportedValidationFailures;
          if (unreportedFailures > 0) {
            showToast(`${String(unreportedFailures)} 张图片上传失败，可在对应页面重传`, "error");
          }
        });
      } catch (error) {
        console.error("[ComicDetailModal] 分配页面失败:", error);
        showLocalCaughtError(error, showToast, "分配页面失败", true);
      }
    },
    [chapterId, client, onAddPages, showToast],
  );

  const handleDeleteAllChapterPages = useCallback(async () => {
    if (!chapterId || !onDeleteChapterPages) return;

    setIsDeletingChapterPages(true);
    const res = await onDeleteChapterPages(chapterId);
    setIsDeletingChapterPages(false);

    if (!res.success) {
      console.error("[ComicDetailModal] 批量删除页面失败:", res);
      showLocalApiFailure(res, showToast);
      return;
    }

    setServerPages([]);
    clearChapterUploadTasks(chapterId);
    await reloadLoadedChapters();
    showToast("页面已清空", "success");
  }, [chapterId, onDeleteChapterPages, reloadLoadedChapters, showToast]);

  const handleReuploadPage = useCallback(
    async (pageId: string, file: File) => {
      if (!chapterId || !onAllocPageUpload || reuploadingPageIds[pageId] === true) return;

      try {
        const started = await startPageReupload(client, chapterId, pageId, file);
        void started.completion.then((summary) => {
          if (summary.succeeded > 0) {
            showToast("重上传成功", "success");
            return;
          }
          if (summary.reportedValidationFailures > 0) return;
          showToast("重上传失败，请检查对应页面", "error");
        });
      } catch (error) {
        console.error("[ComicDetailModal] 重上传分配失败:", error);
        showLocalCaughtError(error, showToast, "重上传失败", true);
      }
    },
    [chapterId, client, onAllocPageUpload, reuploadingPageIds, showToast],
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
    reloadChapterStats,
    handleAddRawPages,
    handleDeleteAllChapterPages,
    handleReuploadPage,
  };
}
