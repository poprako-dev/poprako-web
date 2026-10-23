import { useMemo } from "react";

import type { PageInfo } from "@/route/_authenticated/business/page/page";

import {
  EMPTY_PAGE_UPLOAD_TASKS,
  type PageUploadTaskStatus,
  type PageUploadTaskView,
  usePageUploadTaskStore,
} from "@/route/_authenticated/_shell/business/comic-detail/upload/page-upload-store";

import type { PageState } from "./use-comic-detail-pages";

function isActiveTask(status: PageUploadTaskStatus): boolean {
  return ["preparing", "queued", "uploading", "confirming"].includes(status);
}

function latestTasksByPage(
  tasks: Record<string, PageUploadTaskView>,
): Map<string, PageUploadTaskView> {
  const latest = new Map<string, PageUploadTaskView>();
  for (const task of Object.values(tasks)) {
    if (!task.pageId) continue;
    latest.set(task.pageId, task);
  }
  return latest;
}

export function mergePendingPages(
  serverPages: PageInfo[],
  taskByPageId: Map<string, PageUploadTaskView>,
): PageInfo[] {
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
}

type PageTaskView = Pick<
  PageState,
  "uploadProgressByPageId" | "uploadStatusByPageId" | "uploadErrorByPageId" | "reuploadingPageIds"
> & { taskByPageId: Map<string, PageUploadTaskView> };

function summarizeTasks(
  taskByPageId: Map<string, PageUploadTaskView>,
): Omit<PageTaskView, "taskByPageId"> {
  const uploadProgressByPageId: Record<string, number> = {};
  const uploadStatusByPageId: Record<string, PageUploadTaskStatus> = {};
  const uploadErrorByPageId: Record<string, string> = {};
  const reuploadingPageIds: Record<string, boolean> = {};
  for (const [pageId, task] of taskByPageId) {
    uploadStatusByPageId[pageId] = task.status;
    if (isActiveTask(task.status)) {
      uploadProgressByPageId[pageId] = task.progress;
      reuploadingPageIds[pageId] = true;
    }
    if (task.status === "failed" && task.error) uploadErrorByPageId[pageId] = task.error;
  }
  return { uploadProgressByPageId, uploadStatusByPageId, uploadErrorByPageId, reuploadingPageIds };
}

export function usePageTaskView(chapterId: string | null): PageTaskView {
  const uploadTasks = usePageUploadTaskStore((state) =>
    chapterId
      ? (state.tasksByChapter[chapterId] ?? EMPTY_PAGE_UPLOAD_TASKS)
      : EMPTY_PAGE_UPLOAD_TASKS,
  );
  const taskByPageId = useMemo(() => latestTasksByPage(uploadTasks), [uploadTasks]);

  const summary = useMemo(() => summarizeTasks(taskByPageId), [taskByPageId]);
  return { taskByPageId, ...summary };
}
