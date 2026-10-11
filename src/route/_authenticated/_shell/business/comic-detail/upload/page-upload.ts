import type { ApiClient } from "@/api/client";
import type { UploadProgressCallbacks } from "@/route/_authenticated/business/page/page";
import { getFileExtension } from "@/route/_authenticated/_shell/business/comic-detail/utils";
import { hashPageFile } from "@/shared/utility/hash/image-hash";
import { putPageUploadTask } from "@/route/_authenticated/_shell/business/comic-detail/upload/page-upload-store";
import {
  assertSessionGeneration,
  currentSessionGeneration,
  enqueueTask,
  nextId,
  patchTask,
  type RuntimeTask,
  serializeChapterAlloc,
  summarizeSingleTask,
} from "@/route/_authenticated/_shell/business/comic-detail/upload/page-upload-runtime";
import { runPageUploadAllocation } from "@/route/_authenticated/_shell/business/comic-detail/upload/page-upload-allocation";
import type {
  PreparedFile,
  StartPageUploadResult,
} from "@/route/_authenticated/_shell/business/comic-detail/upload/page-upload-types";
export { cancelAllPageUploads } from "@/route/_authenticated/_shell/business/comic-detail/upload/page-upload-runtime";
export type {
  PageUploadBatchSummary,
  StartPageUploadResult,
} from "@/route/_authenticated/_shell/business/comic-detail/upload/page-upload-types";

type AddChapterPagesArgs = {
  client: ApiClient;
  chapterId: string;
  files: File[];
  callbacks?: UploadProgressCallbacks | undefined;
  logPrefix?: string | undefined;
};

function validateFile(file: File): string {
  const extension = getFileExtension(file);
  if (!extension) throw new Error("请选择带后缀的图片文件");
  return extension;
}

async function prepareFile(
  batchId: string,
  chapterId: string,
  file: File,
  fileIndex: number,
  sessionGeneration: number,
): Promise<PreparedFile> {
  const taskId = nextId("page-upload");
  if (sessionGeneration === currentSessionGeneration()) {
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
  }

  try {
    const extension = validateFile(file);
    const { imageHash } = await hashPageFile(file);
    assertSessionGeneration(sessionGeneration);

    return {
      taskId,
      file,
      imageHash,
      extension,
      fileIndex,
      sessionGeneration,
    };
  } catch (error) {
    patchTask(taskId, sessionGeneration, {
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function startChapterPageUpload(
  client: ApiClient,
  chapterId: string,
  files: File[],
  callbacks?: UploadProgressCallbacks,
  logPrefix = "PageUpload",
): Promise<StartPageUploadResult> {
  const sessionGeneration = currentSessionGeneration();
  const batchId = nextId("page-upload-batch");
  const preparedFiles = await Promise.all(
    files.map((file, index) => prepareFile(batchId, chapterId, file, index, sessionGeneration)),
  );
  try {
    return await serializeChapterAlloc(chapterId, () =>
      runPageUploadAllocation({
        client,
        chapterId,
        preparedFiles,
        callbacks,
        batchId,
        logPrefix,
        sessionGeneration,
      }),
    );
  } catch (error) {
    markPreparedFilesFailed(preparedFiles, sessionGeneration, error);
    throw error;
  }
}

function markPreparedFilesFailed(
  preparedFiles: PreparedFile[],
  sessionGeneration: number,
  error: unknown,
): void {
  const message = error instanceof Error ? error.message : String(error);
  for (const prepared of preparedFiles) {
    patchTask(prepared.taskId, sessionGeneration, { status: "failed", error: message });
  }
}

export async function startPageReupload(
  client: ApiClient,
  chapterId: string,
  pageId: string,
  file: File,
): Promise<StartPageUploadResult> {
  const sessionGeneration = currentSessionGeneration();
  const batchId = nextId("page-reupload-batch");
  const prepared = await prepareFile(batchId, chapterId, file, 0, sessionGeneration);
  assertSessionGeneration(sessionGeneration);

  patchTask(prepared.taskId, sessionGeneration, {
    pageId,
    status: "queued",
  });

  const runtimeTask: RuntimeTask = {
    client,
    taskId: prepared.taskId,
    batchId,
    chapterId,
    pageId,
    file,
    imageHash: prepared.imageHash,
    extension: prepared.extension,
    slot: undefined,
    logPrefix: "PageReupload",
    abortController: new AbortController(),
    cancelled: false,
    sessionGeneration,
  };

  return {
    batchId,
    allocatedCount: 1,
    skippedCount: 0,
    completion: summarizeSingleTask(enqueueTask(runtimeTask)),
  };
}

export async function addChapterPages({
  client,
  chapterId,
  files,
  callbacks,
  logPrefix,
}: AddChapterPagesArgs): Promise<void> {
  await startChapterPageUpload(client, chapterId, files, callbacks, logPrefix);
}
