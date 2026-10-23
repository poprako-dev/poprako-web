import type { ApiClient } from "@/api/client";
import type { UploadProgressCallbacks } from "@/route/_authenticated/business/page/page";
import { getFileExtension } from "@/route/_authenticated/_shell/business/comic-detail/utils";
import { hashPageFile } from "@/shared/utility/hash/image-hash";
import { patchPageUploadTasks, putPageUploadTasks } from "./page-upload-store";
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

function registerFiles(
  batchId: string,
  chapterId: string,
  files: File[],
  sessionGeneration: number,
): Pick<PreparedFile, "taskId" | "file" | "fileIndex">[] {
  const inputs = files.map((file, fileIndex) => ({
    taskId: nextId("page-upload"),
    file,
    fileIndex,
  }));
  if (sessionGeneration === currentSessionGeneration()) {
    putPageUploadTasks(
      inputs.map(({ taskId, file }) => ({
        taskId,
        batchId,
        chapterId,
        pageId: null,
        index: null,
        fileName: file.name,
        progress: 0,
        attempt: 0,
        status: "preparing" as const,
        error: null,
      })),
    );
  }
  return inputs;
}

async function prepareFile(
  { taskId, file, fileIndex }: Pick<PreparedFile, "taskId" | "file" | "fileIndex">,
  sessionGeneration: number,
): Promise<PreparedFile> {
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
  const inputs = registerFiles(batchId, chapterId, files, sessionGeneration);
  const preparedFiles = await Promise.all(
    inputs.map((input) => prepareFile(input, sessionGeneration)),
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
  if (sessionGeneration !== currentSessionGeneration()) return;
  patchPageUploadTasks(
    preparedFiles.map(({ taskId }) => ({
      taskId,
      patch: { status: "failed", error: message },
    })),
  );
}

export async function startPageReupload(
  client: ApiClient,
  chapterId: string,
  pageId: string,
  file: File,
): Promise<StartPageUploadResult> {
  const sessionGeneration = currentSessionGeneration();
  const batchId = nextId("page-reupload-batch");
  const input = registerFiles(batchId, chapterId, [file], sessionGeneration)[0];
  if (!input) throw new Error("请选择上传文件");
  const prepared = await prepareFile(input, sessionGeneration);
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
