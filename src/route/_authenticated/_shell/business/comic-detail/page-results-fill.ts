import type { Dispatch, SetStateAction } from "react";
import type { ApiClient } from "@/api/client";
import type { PageInfo } from "@/route/_authenticated/business/page/page";
import { getPage } from "@/route/_authenticated/business/page/page-request";
import { showLocalApiFailure, showLocalCaughtError } from "@/route/business/request-error";
import type { ToastType } from "@/shared/component/notification-toast/notification-toast-type";
import {
  isCurrentPageResultsOwner,
  latestPageUploadTask,
  type PageResultsOwner,
} from "./page-results-owner";
import type { PageUploadTaskView } from "./upload/page-upload-store";

type FillArgs = {
  client: ApiClient;
  owner: PageResultsOwner;
  ownerRef: React.RefObject<PageResultsOwner | null>;
  task: PageUploadTaskView;
  showToast: (message: string, type: ToastType) => void;
  setServerPages: Dispatch<SetStateAction<PageInfo[]>>;
  setPageRecoveryNeeded: Dispatch<SetStateAction<boolean>>;
};

export async function fillPageResult(args: FillArgs): Promise<void> {
  const { owner, ownerRef, task } = args;
  if (!isFillCandidate(owner, task)) return;
  const pageId = task.pageId;
  if (!pageId) return;
  const epoch = owner.epoch;
  owner.pending.add(task.taskId);
  try {
    const result = await getPage(args.client, pageId);
    if (!isLatestPageFill(owner, ownerRef, pageId, task.taskId, epoch)) return;
    if (!result.success) {
      reportPageFillFailure(args, result);
      return;
    }
    if (result.data.chapterId !== owner.chapterId || result.data.id !== pageId) {
      throw new Error("回填结果不属于当前章节页面");
    }
    owner.succeeded.add(task.taskId);
    owner.fills.set(pageId, { page: result.data, revision: ++owner.revision });
    args.setServerPages((pages) => insertCurrentPage(pages, args, result.data, epoch));
  } catch (error) {
    if (isLatestPageFill(owner, ownerRef, pageId, task.taskId, epoch)) {
      reportPageFillException(args, error);
    }
  } finally {
    owner.pending.delete(task.taskId);
  }
}

function isFillCandidate(owner: PageResultsOwner, task: PageUploadTaskView): boolean {
  return Boolean(
    task.pageId &&
      task.status === "succeeded" &&
      !owner.pending.has(task.taskId) &&
      !owner.succeeded.has(task.taskId) &&
      !owner.failed.has(task.taskId),
  );
}

function isLatestPageFill(
  owner: PageResultsOwner,
  ownerRef: React.RefObject<PageResultsOwner | null>,
  pageId: string,
  taskId: string,
  epoch: number,
): boolean {
  return (
    isCurrentPageResultsOwner(owner, ownerRef, epoch) &&
    latestPageUploadTask(pageId, owner.chapterId)?.taskId === taskId
  );
}

function insertCurrentPage(
  pages: PageInfo[],
  args: FillArgs,
  page: PageInfo,
  epoch: number,
): PageInfo[] {
  if (!isLatestPageFill(args.owner, args.ownerRef, page.id, args.task.taskId, epoch)) return pages;
  return [...pages.filter((item) => item.id !== page.id), page];
}

function reportPageFillFailure(
  args: FillArgs,
  result: Extract<Awaited<ReturnType<typeof getPage>>, { success: false }>,
): void {
  const { owner, task, showToast, setPageRecoveryNeeded } = args;
  const pageId = task.pageId;
  console.error("[ComicDetailModal] 上传页面回填失败", {
    chapterId: owner.chapterId,
    pageId,
    taskId: task.taskId,
    result,
  });
  owner.failed.add(task.taskId);
  setPageRecoveryNeeded(true);
  showLocalApiFailure(result, showToast, "上传后的页面信息加载失败，请重新加载页面");
}

function reportPageFillException(args: FillArgs, error: unknown): void {
  const { owner, task, showToast, setPageRecoveryNeeded } = args;
  console.error("[ComicDetailModal] 上传页面回填异常", {
    chapterId: owner.chapterId,
    pageId: task.pageId,
    taskId: task.taskId,
    error,
  });
  owner.failed.add(task.taskId);
  setPageRecoveryNeeded(true);
  showLocalCaughtError(error, showToast, "上传后的页面信息加载失败，请重新加载页面");
}

export type PageFillDependencies = Pick<
  FillArgs,
  "client" | "ownerRef" | "showToast" | "setServerPages" | "setPageRecoveryNeeded"
>;
