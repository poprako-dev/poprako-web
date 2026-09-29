import {
  allocExistingPageUpload,
  updatePage,
} from "@/route/_authenticated/business/page/page-request";
import type { AllocatedPage } from "@/route/_authenticated/business/page/page";
import { isReportedValidationError, toApiRequestError } from "@/route/business/request-error";
import {
  bumpPageUploadChapterRevision,
  clearPageUploadTasks,
  patchPageUploadTask,
} from "@/route/_authenticated/_shell/business/comic-detail/upload/page-upload-store";
import { useAppStore } from "@/route/business/session/session-store";
import type {
  PageUploadBatchSummary,
  QueueEntry,
  RuntimeTask,
  TaskOutcome,
} from "@/route/_authenticated/_shell/business/comic-detail/upload/page-upload-types";
const WORKER_CONCURRENCY = 4;
const PUT_ATTEMPTS = 3;
const MARK_ATTEMPTS = 3;
export type { RuntimeTask } from "@/route/_authenticated/_shell/business/comic-detail/upload/page-upload-types";
const queue: QueueEntry[] = [];
const activeTasks = new Map<string, RuntimeTask>();
const chapterAllocTails = new Map<string, Promise<void>>();
const pageTaskTails = new Map<string, Promise<void>>();

function noop(): void {
  return;
}

const activeWorkerCount = { value: 0 };
const taskSequence = { value: 0 };
const unsubscribeFromSession = useAppStore.subscribe((state, previous) => {
  if (state.generation === previous.generation) return;
  cancelAllPageUploads();
});

import.meta.hot?.dispose(() => {
  unsubscribeFromSession();
  cancelAllPageUploads();
});

export function currentSessionGeneration(): number {
  return useAppStore.getState().generation;
}

export function assertSessionGeneration(generation: number): void {
  if (generation !== currentSessionGeneration()) {
    throw new Error("会话已变更，上传任务已取消");
  }
}

export function patchTask(
  taskId: string,
  generation: number,
  patch: Parameters<typeof patchPageUploadTask>[1],
): void {
  if (generation === currentSessionGeneration()) {
    patchPageUploadTask(taskId, patch);
  }
}

export function nextId(prefix: string): string {
  taskSequence.value += 1;
  return `${prefix}-${String(Date.now())}-${String(taskSequence.value)}`;
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function serialize<T>(
  tails: Map<string, Promise<void>>,
  key: string,
  operation: () => Promise<T>,
): Promise<T> {
  const previous = tails.get(key) ?? Promise.resolve();
  let release: () => void = noop;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const current = continueAfterPrevious(previous, gate);

  tails.set(key, current);
  await settle(previous);

  try {
    return await operation();
  } finally {
    release();
    if (tails.get(key) === current) tails.delete(key);
  }
}

async function settle(promise: Promise<void>): Promise<void> {
  try {
    await promise;
  } catch {
    return;
  }
}

async function continueAfterPrevious(previous: Promise<void>, gate: Promise<void>): Promise<void> {
  await settle(previous);
  return gate;
}

export function serializeChapterAlloc<T>(
  chapterId: string,
  operation: () => Promise<T>,
): Promise<T> {
  return serialize(chapterAllocTails, chapterId, operation);
}

function serializePageTask<T>(pageId: string, operation: () => Promise<T>): Promise<T> {
  return serialize(pageTaskTails, pageId, operation);
}

function isTaskCancelled(task: RuntimeTask): boolean {
  return task.cancelled || task.sessionGeneration !== currentSessionGeneration();
}

function failTask(task: RuntimeTask, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  if (!isTaskCancelled(task)) {
    console.error(`[${task.logPrefix}] 页面上传失败:`, task.pageId, message);
  }
  patchTask(task.taskId, task.sessionGeneration, {
    status: "failed",
    error: message,
  });
}

function succeedTask(task: RuntimeTask): void {
  if (isTaskCancelled(task)) return;
  patchTask(task.taskId, task.sessionGeneration, {
    status: "succeeded",
    progress: 100,
    error: null,
  });
  if (!isTaskCancelled(task)) {
    task.callbacks?.onPageUploaded(task.pageId, task.file);
  }
}

async function retryMarkUploaded(task: RuntimeTask, imageVersion: number): Promise<void> {
  let lastError = "等待对象存储确认失败";

  for (let attempt = 1; attempt <= MARK_ATTEMPTS; attempt += 1) {
    if (isTaskCancelled(task)) throw new Error("上传已取消");

    try {
      const result = await updatePage(task.client, task.pageId, {
        isUploaded: true,
        imageVersion,
      });
      if (isTaskCancelled(task)) throw new Error("上传已取消");
      if (result.success) return;
      lastError = result.error;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }

    if (attempt < MARK_ATTEMPTS) {
      await sleep(2 ** (attempt - 1) * 1000);
    }
  }

  throw new Error(lastError);
}

function canRetryPut(httpStatus?: number, failureKind?: string): boolean {
  if (failureKind === "aborted") return false;
  if (httpStatus === 403) return true;
  if (typeof httpStatus !== "number") return true;
  return httpStatus >= 500;
}

async function allocRetrySlot(task: RuntimeTask): Promise<AllocatedPage["slot"]> {
  return serializeChapterAlloc(task.chapterId, async () => {
    if (isTaskCancelled(task)) throw new Error("上传已取消");
    assertSessionGeneration(task.sessionGeneration);
    const result = await allocExistingPageUpload(task.client, {
      pageId: task.pageId,
      rawIdent: task.file.name,
      imageHash: task.imageHash,
      newByteLen: task.file.size,
      extension: task.extension,
    });
    assertSessionGeneration(task.sessionGeneration);
    if (!result.success) throw toApiRequestError(result);
    return result.data.slot;
  });
}

async function allocInitialPage(task: RuntimeTask): Promise<AllocatedPage> {
  return serializeChapterAlloc(task.chapterId, async () => {
    if (isTaskCancelled(task)) throw new Error("上传已取消");
    assertSessionGeneration(task.sessionGeneration);
    const result = await allocExistingPageUpload(task.client, {
      pageId: task.pageId,
      rawIdent: task.file.name,
      imageHash: task.imageHash,
      newByteLen: task.file.size,
      extension: task.extension,
    });
    assertSessionGeneration(task.sessionGeneration);
    if (!result.success) throw toApiRequestError(result);
    return result.data;
  });
}

async function executeTask(task: RuntimeTask): Promise<TaskOutcome> {
  try {
    if (isTaskCancelled(task)) throw new Error("上传已取消");

    let slot = task.slot;
    if (slot === undefined) {
      const allocatedPage = await allocInitialPage(task);
      if (isTaskCancelled(task)) throw new Error("上传已取消");
      slot = allocatedPage.slot;
      task.slot = slot;
      task.imageHash = allocatedPage.imageHash;
      task.extension = allocatedPage.extension;
      patchTask(task.taskId, task.sessionGeneration, {
        index: allocatedPage.index,
      });
      bumpPageUploadChapterRevision(task.chapterId);
    }

    if (slot === null) {
      succeedTask(task);
      return { succeeded: true, reportedValidationError: false };
    }

    for (let attempt = 1; attempt <= PUT_ATTEMPTS; attempt += 1) {
      patchTask(task.taskId, task.sessionGeneration, {
        status: "uploading",
        progress: 0,
        attempt,
        error: null,
      });

      const uploadResult = await task.client.putPresigned({
        url: slot.putUrl,
        file: task.file,
        headers: slot.headers,
        onProgress: (progress) => {
          if (isTaskCancelled(task)) return;
          patchTask(task.taskId, task.sessionGeneration, {
            progress: Math.min(progress, 99),
          });
          task.callbacks?.onPageUploadProgress?.(task.pageId, Math.min(progress, 99));
        },
        signal: task.abortController.signal,
      });
      if (isTaskCancelled(task)) throw new Error("上传已取消");

      if (uploadResult.success) {
        patchTask(task.taskId, task.sessionGeneration, {
          status: "confirming",
          progress: 100,
        });
        task.callbacks?.onPageUploadProgress?.(task.pageId, 100);

        await retryMarkUploaded(task, slot.imageVersion);
        succeedTask(task);
        return { succeeded: true, reportedValidationError: false };
      }

      if (
        attempt >= PUT_ATTEMPTS ||
        !canRetryPut(uploadResult.httpStatus, uploadResult.failureKind)
      ) {
        throw toApiRequestError(uploadResult);
      }

      await sleep(2 ** (attempt - 1) * 1000);
      if (isTaskCancelled(task)) throw new Error("上传已取消");

      slot = await allocRetrySlot(task);
      task.slot = slot;

      if (slot === null) {
        succeedTask(task);
        return { succeeded: true, reportedValidationError: false };
      }
    }

    throw new Error("上传失败");
  } catch (error) {
    failTask(task, error);
    return {
      succeeded: false,
      reportedValidationError: isReportedValidationError(error),
    };
  }
}

function pumpQueue(): void {
  while (activeWorkerCount.value < WORKER_CONCURRENCY && queue.length > 0) {
    const entry = queue.shift();
    if (!entry) return;

    activeWorkerCount.value += 1;
    activeTasks.set(entry.task.taskId, entry.task);

    void runQueuedTask(entry);
  }
}

async function runQueuedTask(entry: QueueEntry): Promise<void> {
  try {
    const outcome = await serializePageTask(entry.task.pageId, () => executeTask(entry.task));
    entry.resolve(outcome);
  } finally {
    activeWorkerCount.value -= 1;
    activeTasks.delete(entry.task.taskId);
    pumpQueue();
  }
}

export async function summarizeTaskCompletions(
  completions: Promise<TaskOutcome>[],
): Promise<PageUploadBatchSummary> {
  return completionSummary(await Promise.all(completions));
}

export async function summarizeSingleTask(
  completion: Promise<TaskOutcome>,
): Promise<PageUploadBatchSummary> {
  return completionSummary([await completion]);
}

export function enqueueTask(task: RuntimeTask): Promise<TaskOutcome> {
  patchTask(task.taskId, task.sessionGeneration, {
    status: "queued",
    progress: 0,
    attempt: 0,
  });

  return new Promise((resolve) => {
    queue.push({ task, resolve });
    pumpQueue();
  });
}

function completionSummary(results: TaskOutcome[]): PageUploadBatchSummary {
  const succeeded = results.filter((result) => result.succeeded).length;
  return {
    succeeded,
    failed: results.length - succeeded,
    reportedValidationFailures: results.filter((result) => result.reportedValidationError).length,
  };
}

export function cancelAllPageUploads(): void {
  for (const entry of queue.splice(0)) {
    entry.task.cancelled = true;
    entry.task.abortController.abort();
    entry.resolve({ succeeded: false, reportedValidationError: false });
  }

  for (const task of activeTasks.values()) {
    task.cancelled = true;
    task.abortController.abort();
  }

  clearPageUploadTasks();
}
