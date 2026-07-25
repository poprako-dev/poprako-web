import {
  listPages,
  reserveChapterPages,
  reserveExistingPageUpload,
  updatePage,
  uploadToPresignedUrl,
} from "@/features/ComicPlayground/api/page";
import type { PageInfo, ReservedPage, UploadProgressCallbacks } from "@/types";
import { getFileExtension } from "./utils";
import { hashPageFile } from "./pageHash";
import {
  bumpPageUploadChapterRevision,
  clearPageUploadTasks,
  patchPageUploadTask,
  putPageUploadTask,
} from "./pageUploadStore";

const WORKER_CONCURRENCY = 4;
const PUT_ATTEMPTS = 3;
const MARK_ATTEMPTS = 3;

type RuntimeTask = {
  taskId: string;
  batchId: string;
  chapterId: string;
  pageId: string;
  file: File;
  imageHash: string;
  extension: string;
  slot: ReservedPage["slot"] | undefined;
  callbacks?: UploadProgressCallbacks;
  abortController: AbortController;
  cancelled: boolean;
};

type QueueEntry = {
  task: RuntimeTask;
  resolve: (succeeded: boolean) => void;
};

export type PageUploadBatchSummary = {
  succeeded: number;
  failed: number;
};

export type StartPageUploadResult = {
  batchId: string;
  reservedCount: number;
  skippedCount: number;
  completion: Promise<PageUploadBatchSummary>;
};

type AddChapterPagesArgs = {
  chapterId: string;
  files: File[];
  callbacks?: UploadProgressCallbacks;
  logPrefix?: string;
  concurrency?: number;
};

type PreparedFile = {
  taskId: string;
  file: File;
  imageHash: string;
  extension: string;
  fileIndex: number;
};

type ExistingManifestEntry = {
  pageId: string;
  imageHash: string;
  extension: string;
};

const queue: QueueEntry[] = [];
const activeTasks = new Map<string, RuntimeTask>();
const chapterReserveTails = new Map<string, Promise<void>>();
const pageTaskTails = new Map<string, Promise<void>>();

let activeWorkerCount = 0;
let taskSequence = 0;

function nextId(prefix: string): string {
  taskSequence += 1;
  return `${prefix}-${Date.now()}-${taskSequence}`;
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => globalThis.setTimeout(resolve, milliseconds));
}

async function serialize<T>(
  tails: Map<string, Promise<void>>,
  key: string,
  operation: () => Promise<T>,
): Promise<T> {
  const previous = tails.get(key) ?? Promise.resolve();
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const current = previous.catch(() => undefined).then(() => gate);

  tails.set(key, current);
  await previous.catch(() => undefined);

  try {
    return await operation();
  } finally {
    release();
    if (tails.get(key) === current) tails.delete(key);
  }
}

function serializeChapterReserve<T>(
  chapterId: string,
  operation: () => Promise<T>,
): Promise<T> {
  return serialize(chapterReserveTails, chapterId, operation);
}

function serializePageTask<T>(
  pageId: string,
  operation: () => Promise<T>,
): Promise<T> {
  return serialize(pageTaskTails, pageId, operation);
}

function imageIdentity(imageHash: string, extension: string): string {
  return JSON.stringify([imageHash, extension.toLowerCase()]);
}

function validateFile(file: File): string {
  const extension = getFileExtension(file);
  if (!extension) throw new Error("请选择带后缀的图片文件");
  if (file.size < 1 || file.size > 20 * 1024 * 1024) {
    throw new Error("图片大小必须在 1 至 20 MiB 之间");
  }
  return extension;
}

function failTask(task: RuntimeTask, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  patchPageUploadTask(task.taskId, {
    status: "failed",
    error: message,
  });
}

function succeedTask(task: RuntimeTask): void {
  patchPageUploadTask(task.taskId, {
    status: "succeeded",
    progress: 100,
    error: null,
  });
  task.callbacks?.onPageUploaded(task.pageId, task.file);
}

async function retryMarkUploaded(
  task: RuntimeTask,
  imageVersion: number,
): Promise<void> {
  let lastError = "等待对象存储确认失败";

  for (let attempt = 1; attempt <= MARK_ATTEMPTS; attempt += 1) {
    if (task.cancelled) throw new Error("上传已取消");

    try {
      const result = await updatePage(task.pageId, {
        isUploaded: true,
        imageVersion,
      });
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

async function reserveRetrySlot(
  task: RuntimeTask,
): Promise<ReservedPage["slot"]> {
  return serializeChapterReserve(task.chapterId, async () => {
    const result = await reserveExistingPageUpload({
      pageId: task.pageId,
      imageHash: task.imageHash,
      newByteLen: task.file.size,
      extension: task.extension,
    });
    if (!result.success) throw new Error(result.error);
    return result.data.slot;
  });
}

async function reserveInitialPage(task: RuntimeTask): Promise<ReservedPage> {
  return serializeChapterReserve(task.chapterId, async () => {
    const result = await reserveExistingPageUpload({
      pageId: task.pageId,
      imageHash: task.imageHash,
      newByteLen: task.file.size,
      extension: task.extension,
    });
    if (!result.success) throw new Error(result.error);
    return result.data;
  });
}

async function executeTask(task: RuntimeTask): Promise<boolean> {
  try {
    if (task.cancelled) throw new Error("上传已取消");

    let slot = task.slot;
    if (slot === undefined) {
      const reservedPage = await reserveInitialPage(task);
      slot = reservedPage.slot;
      task.slot = slot;
      task.imageHash = reservedPage.imageHash;
      task.extension = reservedPage.extension;
      patchPageUploadTask(task.taskId, { index: reservedPage.index });
      bumpPageUploadChapterRevision(task.chapterId);
    }

    if (slot === null) {
      succeedTask(task);
      return true;
    }

    for (let attempt = 1; attempt <= PUT_ATTEMPTS; attempt += 1) {
      patchPageUploadTask(task.taskId, {
        status: "uploading",
        progress: 0,
        attempt,
        error: null,
      });

      const uploadResult = await uploadToPresignedUrl(
        slot.putUrl,
        task.file,
        slot.headers,
        (progress) => {
          patchPageUploadTask(task.taskId, {
            progress: Math.min(progress, 99),
          });
          task.callbacks?.onPageUploadProgress?.(
            task.pageId,
            Math.min(progress, 99),
          );
        },
        task.abortController.signal,
      );

      if (uploadResult.success) {
        patchPageUploadTask(task.taskId, {
          status: "confirming",
          progress: 100,
        });
        task.callbacks?.onPageUploadProgress?.(task.pageId, 100);

        await retryMarkUploaded(task, slot.imageVersion);
        succeedTask(task);
        return true;
      }

      if (
        attempt >= PUT_ATTEMPTS ||
        !canRetryPut(uploadResult.httpStatus, uploadResult.failureKind)
      ) {
        throw new Error(uploadResult.error);
      }

      await sleep(2 ** (attempt - 1) * 1000);
      if (task.cancelled) throw new Error("上传已取消");

      slot = await reserveRetrySlot(task);
      task.slot = slot;

      if (slot === null) {
        succeedTask(task);
        return true;
      }
    }

    throw new Error("上传失败");
  } catch (error) {
    failTask(task, error);
    return false;
  }
}

function pumpQueue(): void {
  while (activeWorkerCount < WORKER_CONCURRENCY && queue.length > 0) {
    const entry = queue.shift();
    if (!entry) return;

    activeWorkerCount += 1;
    activeTasks.set(entry.task.taskId, entry.task);

    void serializePageTask(entry.task.pageId, () => executeTask(entry.task))
      .then(entry.resolve)
      .finally(() => {
        activeWorkerCount -= 1;
        activeTasks.delete(entry.task.taskId);
        pumpQueue();
      });
  }
}

function enqueueTask(task: RuntimeTask): Promise<boolean> {
  patchPageUploadTask(task.taskId, {
    status: "queued",
    progress: 0,
    attempt: 0,
  });

  return new Promise((resolve) => {
    queue.push({ task, resolve });
    pumpQueue();
  });
}

function completionSummary(results: boolean[]): PageUploadBatchSummary {
  const succeeded = results.filter(Boolean).length;
  return {
    succeeded,
    failed: results.length - succeeded,
  };
}

async function prepareFile(
  batchId: string,
  chapterId: string,
  file: File,
  fileIndex: number,
): Promise<PreparedFile> {
  const taskId = nextId("page-upload");
  putPageUploadTask({
    taskId,
    batchId,
    chapterId,
    pageId: null,
    index: null,
    fileName: file.name,
    progress: 0,
    attempt: 0,
    status: "preparing",
    error: null,
  });

  try {
    const extension = validateFile(file);
    const { imageHash } = await hashPageFile(file);

    return {
      taskId,
      file,
      imageHash,
      extension,
      fileIndex,
    };
  } catch (error) {
    patchPageUploadTask(taskId, {
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

function existingManifest(pages: PageInfo[]): ExistingManifestEntry[] {
  return pages.map((page) => {
    if (!page.imageHash || !page.extension) {
      throw new Error(`页面 ${page.id} 缺少图片身份信息，请刷新后重试`);
    }

    return {
      pageId: page.id,
      imageHash: page.imageHash,
      extension: page.extension,
    };
  });
}

export async function startChapterPageUpload(
  chapterId: string,
  files: File[],
  callbacks?: UploadProgressCallbacks,
): Promise<StartPageUploadResult> {
  const batchId = nextId("page-upload-batch");
  const preparedFiles = await Promise.all(
    files.map((file, index) => prepareFile(batchId, chapterId, file, index)),
  );

  try {
    return await serializeChapterReserve(chapterId, async () => {
      const pagesResult = await listPages({ chapterId });
      if (!pagesResult.success) throw new Error(pagesResult.error);

      const manifest = existingManifest(pagesResult.data);
      const pagesByIdentity = new Map<string, ExistingManifestEntry[]>();
      for (const page of manifest) {
        const identity = imageIdentity(page.imageHash, page.extension);
        const matchingPages = pagesByIdentity.get(identity) ?? [];
        matchingPages.push(page);
        pagesByIdentity.set(identity, matchingPages);
      }

      const preparedFilesByPageId = new Map<string, PreparedFile>();
      const newFiles: PreparedFile[] = [];

      for (const prepared of preparedFiles) {
        const identity = imageIdentity(prepared.imageHash, prepared.extension);
        const matchingPages = pagesByIdentity.get(identity);
        const matchingPage = matchingPages?.shift();
        if (matchingPage) {
          preparedFilesByPageId.set(matchingPage.pageId, prepared);
          continue;
        }

        newFiles.push(prepared);
      }

      const manifestInputs = manifest.map((page) => {
        const prepared = preparedFilesByPageId.get(page.pageId);
        if (!prepared) {
          return {
            pageId: page.pageId,
            imageHash: page.imageHash,
            extension: page.extension,
          };
        }
        return {
          pageId: page.pageId,
          imageHash: page.imageHash,
          newByteLen: prepared.file.size,
          extension: page.extension,
        };
      });

      const reserveResult = await reserveChapterPages({
        chapterId,
        pages: [
          ...manifestInputs,
          ...newFiles.map((prepared) => ({
            imageHash: prepared.imageHash,
            newByteLen: prepared.file.size,
            extension: prepared.extension,
          })),
        ],
      });
      if (!reserveResult.success) throw new Error(reserveResult.error);

      if (
        reserveResult.data.pages.length !==
        manifest.length + newFiles.length
      ) {
        throw new Error("预留页面数量与清单数量不一致");
      }

      const uploadPages: Array<{ page: ReservedPage; prepared: PreparedFile }> = [];
      for (const [index, page] of reserveResult.data.pages.entries()) {
        const prepared = index < manifest.length
          ? preparedFilesByPageId.get(page.pageId)
          : newFiles[index - manifest.length];
        if (!prepared) continue;
        if (!page.slot) {
          patchPageUploadTask(prepared.taskId, {
            pageId: page.pageId,
            index: page.index,
            status: "succeeded",
            progress: 100,
            error: null,
          });
          continue;
        }
        uploadPages.push({ page, prepared });
      }

      callbacks?.onPagesReserved(
        uploadPages.map(({ page, prepared }) => ({
          pageId: page.pageId,
          index: page.index,
          fileIndex: prepared.fileIndex,
        })),
      );

      const taskCompletions = uploadPages.map(({ page, prepared }) => {
        patchPageUploadTask(prepared.taskId, {
          pageId: page.pageId,
          index: page.index,
          status: "queued",
        });

        const runtimeTask: RuntimeTask = {
          taskId: prepared.taskId,
          batchId,
          chapterId,
          pageId: page.pageId,
          file: prepared.file,
          imageHash: page.imageHash,
          extension: page.extension,
          slot: page.slot,
          callbacks,
          abortController: new AbortController(),
          cancelled: false,
        };
        return enqueueTask(runtimeTask);
      });

      bumpPageUploadChapterRevision(chapterId);

      return {
        batchId,
        reservedCount: uploadPages.length,
        skippedCount: preparedFiles.length - uploadPages.length,
        completion: Promise.all(taskCompletions).then(completionSummary),
      };
    });
  } catch (error) {
    for (const prepared of preparedFiles) {
      patchPageUploadTask(prepared.taskId, {
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
      });
    }
    throw error;
  }
}

export async function startPageReupload(
  chapterId: string,
  pageId: string,
  file: File,
): Promise<StartPageUploadResult> {
  const batchId = nextId("page-reupload-batch");
  const prepared = await prepareFile(batchId, chapterId, file, 0);

  patchPageUploadTask(prepared.taskId, {
    pageId,
    status: "queued",
  });

  const runtimeTask: RuntimeTask = {
    taskId: prepared.taskId,
    batchId,
    chapterId,
    pageId,
    file,
    imageHash: prepared.imageHash,
    extension: prepared.extension,
    slot: undefined,
    abortController: new AbortController(),
    cancelled: false,
  };

  return {
    batchId,
    reservedCount: 1,
    skippedCount: 0,
    completion: enqueueTask(runtimeTask).then((succeeded) =>
      completionSummary([succeeded]),
    ),
  };
}

export async function addChapterPages({
  chapterId,
  files,
  callbacks,
}: AddChapterPagesArgs): Promise<void> {
  await startChapterPageUpload(chapterId, files, callbacks);
}

export function cancelAllPageUploads(): void {
  for (const entry of queue.splice(0)) {
    entry.task.cancelled = true;
    entry.task.abortController.abort();
    entry.resolve(false);
  }

  for (const task of activeTasks.values()) {
    task.cancelled = true;
    task.abortController.abort();
  }

  clearPageUploadTasks();
}
