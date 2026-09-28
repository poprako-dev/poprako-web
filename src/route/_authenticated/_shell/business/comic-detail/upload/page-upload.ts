import { allocChapterPages, listPages } from "@/route/_authenticated/business/page/page-request";
import type { ApiClient } from "@/api/client";
import type {
  AllocatedPage,
  PageInfo,
  UploadProgressCallbacks,
} from "@/route/_authenticated/business/page/page";
import { toApiRequestError } from "@/route/business/request-error";
import { getFileExtension } from "@/route/_authenticated/_shell/business/comic-detail/utils";
import { hashPageFile } from "@/shared/utility/hash/image-hash";
import {
  bumpPageUploadChapterRevision,
  putPageUploadTask,
} from "@/route/_authenticated/_shell/business/comic-detail/upload/page-upload-store";
import {
  assertSessionGeneration,
  currentSessionGeneration,
  enqueueTask,
  nextId,
  patchTask,
  type RuntimeTask,
  serializeChapterAlloc,
  summarizeSingleTask,
  summarizeTaskCompletions,
} from "@/route/_authenticated/_shell/business/comic-detail/upload/page-upload-runtime";
import type { StartPageUploadResult } from "@/route/_authenticated/_shell/business/comic-detail/upload/page-upload-types";
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
type PreparedFile = {
  taskId: string;
  file: File;
  imageHash: string;
  extension: string;
  fileIndex: number;
  sessionGeneration: number;
};
type ExistingManifestEntry = {
  pageId: string;
  imageHash: string;
  extension: string;
};

function validateFile(file: File): string {
  const extension = getFileExtension(file);
  if (!extension) throw new Error("请选择带后缀的图片文件");
  return extension;
}

function imageIdentity(imageHash: string, extension: string): string {
  return JSON.stringify([imageHash, extension.toLowerCase()]);
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
    return await serializeChapterAlloc(chapterId, async () => {
      assertSessionGeneration(sessionGeneration);
      const pagesResult = await listPages(client, { chapterId });
      assertSessionGeneration(sessionGeneration);
      if (!pagesResult.success) throw toApiRequestError(pagesResult);

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
          rawIdent: prepared.file.name,
          imageHash: page.imageHash,
          newByteLen: prepared.file.size,
          extension: page.extension,
        };
      });

      const allocResult = await allocChapterPages(client, {
        chapterId,
        pages: [
          ...manifestInputs,
          ...newFiles.map((prepared) => ({
            rawIdent: prepared.file.name,
            imageHash: prepared.imageHash,
            newByteLen: prepared.file.size,
            extension: prepared.extension,
          })),
        ],
      });
      assertSessionGeneration(sessionGeneration);
      if (!allocResult.success) throw toApiRequestError(allocResult);

      if (allocResult.data.pages.length !== manifest.length + newFiles.length) {
        throw new Error("分配页面数量与清单数量不一致");
      }

      const uploadPages: { page: AllocatedPage; prepared: PreparedFile }[] = [];
      for (const [index, page] of allocResult.data.pages.entries()) {
        const prepared =
          index < manifest.length
            ? preparedFilesByPageId.get(page.pageId)
            : newFiles[index - manifest.length];
        if (!prepared) continue;
        if (!page.slot) {
          patchTask(prepared.taskId, sessionGeneration, {
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

      callbacks?.onPagesAllocated(
        uploadPages.map(({ page, prepared }) => ({
          pageId: page.pageId,
          index: page.index,
          fileIndex: prepared.fileIndex,
        })),
      );

      const taskCompletions = uploadPages.map(({ page, prepared }) => {
        patchTask(prepared.taskId, sessionGeneration, {
          pageId: page.pageId,
          index: page.index,
          status: "queued",
        });

        const runtimeTask: RuntimeTask = {
          client,
          taskId: prepared.taskId,
          batchId,
          chapterId,
          pageId: page.pageId,
          file: prepared.file,
          imageHash: page.imageHash,
          extension: page.extension,
          slot: page.slot,
          callbacks,
          logPrefix,
          abortController: new AbortController(),
          cancelled: false,
          sessionGeneration,
        };
        return enqueueTask(runtimeTask);
      });

      bumpPageUploadChapterRevision(chapterId);

      return {
        batchId,
        allocatedCount: uploadPages.length,
        skippedCount: preparedFiles.length - uploadPages.length,
        completion: summarizeTaskCompletions(taskCompletions),
      };
    });
  } catch (error) {
    for (const prepared of preparedFiles) {
      patchTask(prepared.taskId, sessionGeneration, {
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
      });
    }
    throw error;
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
