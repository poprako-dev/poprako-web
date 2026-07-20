import {
  reserveChapterPages,
  reserveExistingPageUpload,
  updatePage,
  uploadToPresignedUrl,
} from "@/features/ComicPlayground/api/page";
import type { ToastType } from "@/components/ui/NotificationToast";
import type { UploadProgressCallbacks } from "@/types";
import { getFileExtension } from "./utils";

type ShowToast = (message: string, type: ToastType) => void;

type Args = {
  chapterId: string;
  files: File[];
  callbacks?: UploadProgressCallbacks;
  showToast: ShowToast;
  logPrefix: string;
  /** 并发上传数，默认 16 */
  concurrency?: number;
};

const DEFAULT_CONCURRENCY = 16;

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

  const markResult = await updatePage(creation.pageId, {
    isUploaded: true,
    imageVersion: upload.imageVersion,
  });
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
  showToast,
  logPrefix,
  concurrency = DEFAULT_CONCURRENCY,
}: Args): Promise<void> {
  const pages = await Promise.all(files.map(async (file) => {
    const extension = getFileExtension(file);
    if (!extension) throw new Error("请选择带后缀的图片文件");
    if (file.size < 1 || file.size > 20 * 1024 * 1024) throw new Error("图片大小必须在 1 至 20 MiB 之间");
    const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
    const imageHash = btoa(String.fromCharCode(...new Uint8Array(digest)));
    return { imageHash, byteLength: file.size, extension };
  }));

  const reserveResult = await reserveChapterPages({
    chapterId,
    pages,
  });
  if (!reserveResult.success) {
    throw new Error(reserveResult.error);
  }

  const reservedPages = reserveResult.data.pages;
  if (reservedPages.length !== files.length) {
    throw new Error("预留页面数量与选择文件数量不一致");
  }

  callbacks?.onPagesReserved(
    reservedPages.map((page) => ({
      pageId: page.pageId,
      index: page.index,
    })),
  );

  // 并发 worker pool：每个 worker 从队列取下一个文件上传，直到全部完成或出错
  let firstError: Error | null = null;
  let cursor = 0;
  const limit = Math.min(concurrency, files.length);

  async function worker(): Promise<void> {
    while (cursor < files.length && firstError === null) {
      const i = cursor++;
      try {
        await uploadOnePage(
          files[i],
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
