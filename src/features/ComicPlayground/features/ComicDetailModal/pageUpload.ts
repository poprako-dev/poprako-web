import {
  listPages,
  reserveChapterPages,
  reserveExistingPageUpload,
  updatePage,
  uploadToPresignedUrl,
} from "@/features/ComicPlayground/api/page";
import type { UploadProgressCallbacks } from "@/types";
import type { Result } from "@/types/utils/result";
import { getFileExtension } from "./utils";
import { hashPageFile } from "./pageHash";

type Args = {
  chapterId: string;
  files: File[];
  callbacks?: UploadProgressCallbacks;
  logPrefix: string;
  /** 并发上传数，默认 16 */
  concurrency?: number;
};

const DEFAULT_CONCURRENCY = 16;

type PageManifestImage = {
  imageHash: string;
  byteLength: number;
  extension: string;
};

type NewPage = {
  file: File;
  manifest: PageManifestImage;
  fileIndex: number;
};

function imageIdentity({
  imageHash,
  byteLength,
  extension,
}: PageManifestImage): string {
  return JSON.stringify([imageHash, byteLength, extension]);
}

async function retryMarkUploaded(
  pageId: string,
  imageVersion: number,
  logPrefix: string,
  maxAttempts = 3,
): Promise<Result<void>> {
  let lastResult: Result<void> | undefined;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let result: Result<void>;
    try {
      result = await updatePage(pageId, {
        isUploaded: true,
        imageVersion,
      });
    } catch (err) {
      result = {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
    if (result.success) return result;

    lastResult = result;
    if (attempt < maxAttempts) {
      const delay = Math.pow(2, attempt - 1) * 1000;
      console.warn(
        `[${logPrefix}] 标记页面上传状态失败 (attempt ${attempt}/${maxAttempts}):`,
        result.error,
        `— ${delay / 1000}s 后重试...`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  return lastResult!;
}

async function uploadOnePage(
  file: File,
  creation: import("@/types").ReservedPage,
  callbacks: UploadProgressCallbacks | undefined,
  logPrefix: string,
): Promise<void> {
  let upload = creation.upload;
  if (upload === null) return;

  let uploadResult = await uploadToPresignedUrl(
    upload.putUrl,
    file,
    upload.headers,
    (percent) => callbacks?.onPageUploadProgress?.(creation.pageId, percent),
  );

  // presigned URL 过期（S3 403）时重新预留并重试一次
  if (!uploadResult.success && uploadResult.httpStatus === 403) {
    console.warn(
      `[${logPrefix}] presigned URL expired for page ${creation.pageId}, re-reserving...`,
    );

    const reReserveResult = await reserveExistingPageUpload({
      pageId: creation.pageId,
      imageHash: creation.imageHash,
      byteLength: creation.byteLength,
      extension: creation.extension,
    });
    if (!reReserveResult.success) {
      console.error(
        `[${logPrefix}] 重新预留上传URL失败:`,
        reReserveResult.error,
      );
      throw new Error(reReserveResult.error);
    }

    upload = reReserveResult.data.upload;
    if (upload === null) return;

    uploadResult = await uploadToPresignedUrl(
      upload.putUrl,
      file,
      upload.headers,
      (percent) => callbacks?.onPageUploadProgress?.(creation.pageId, percent),
    );
  }

  if (!uploadResult.success) {
    throw new Error(uploadResult.error);
  }

  const markResult = await retryMarkUploaded(
    creation.pageId,
    upload.imageVersion,
    logPrefix,
  );
  if (!markResult.success) {
    console.error(`[${logPrefix}] 标记页面上传状态失败:`, markResult.error);
    throw new Error(markResult.error);
  }

  callbacks?.onPageUploaded(creation.pageId, file);
}

export async function addChapterPages({
  chapterId,
  files,
  callbacks,
  logPrefix,
  concurrency = DEFAULT_CONCURRENCY,
}: Args): Promise<void> {
  const existingPagesResult = await listPages({
    chapterId,
  });
  if (!existingPagesResult.success) {
    throw new Error(existingPagesResult.error);
  }

  const existingManifest = existingPagesResult.data.map((page) => {
    if (!page.imageHash || !page.byteLength || !page.extension) {
      throw new Error(`页面 ${page.id} 缺少图片身份信息，请刷新后重试`);
    }

    return {
      pageId: page.id,
      imageHash: page.imageHash,
      byteLength: page.byteLength,
      extension: page.extension,
    };
  });

  const newPages = await Promise.all(files.map(async (file, fileIndex): Promise<NewPage> => {
    const extension = getFileExtension(file);
    if (!extension) throw new Error("请选择带后缀的图片文件");
    if (file.size < 1 || file.size > 20 * 1024 * 1024) throw new Error("图片大小必须在 1 至 20 MiB 之间");
    const { imageHash } = await hashPageFile(file);
    return {
      file,
      manifest: { imageHash, byteLength: file.size, extension },
      fileIndex,
    };
  }));

  const imageIdentities = new Set(existingManifest.map(imageIdentity));
  const uniqueNewPages = newPages.filter(({ manifest }) => {
    const identity = imageIdentity(manifest);
    if (imageIdentities.has(identity)) return false;
    imageIdentities.add(identity);
    return true;
  });

  const newManifest = uniqueNewPages.map(({ manifest }) => manifest);

  const reserveResult = await reserveChapterPages({
    chapterId,
    pages: [...existingManifest, ...newManifest],
  });
  if (!reserveResult.success) {
    throw new Error(reserveResult.error);
  }

  const allReservedPages = reserveResult.data.pages;
  if (allReservedPages.length !== existingManifest.length + newManifest.length) {
    throw new Error("预留页面数量与选择文件数量不一致");
  }

  const reservedPages = allReservedPages.slice(existingManifest.length);

  callbacks?.onPagesReserved(
    reservedPages.map((page, i) => ({
      pageId: page.pageId,
      index: page.index,
      fileIndex: uniqueNewPages[i].fileIndex,
    })),
  );

  // 并发 worker pool：每个 worker 从队列取下一个文件上传，直到全部完成或出错
  let firstError: Error | null = null;
  let cursor = 0;
  const limit = Math.min(concurrency, uniqueNewPages.length);

  async function worker(): Promise<void> {
    while (cursor < uniqueNewPages.length && firstError === null) {
      const i = cursor++;
      try {
        await uploadOnePage(
          uniqueNewPages[i].file,
          reservedPages[i],
          callbacks,
          logPrefix,
        );
      } catch (err) {
        if (firstError === null) {
          firstError = err instanceof Error ? err : new Error(String(err));
        }
      }
    }
  }

  await Promise.all(Array.from({ length: limit }, () => worker()));

  if (firstError !== null) {
    throw firstError;
  }
}
