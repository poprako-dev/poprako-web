import {
  reserveChapterPages,
  updatePage,
  uploadToPresignedUrl,
} from "@/features/ComicPlayground/api/page";
import type { ToastType } from "@/components/ui/NotificationToast";
import type { UploadProgressCallbacks } from "@/types";
import { getUniformFileExtension } from "./utils";

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
  creation: { pageId: string; putUrl: string; imageVersion: number },
  callbacks: UploadProgressCallbacks | undefined,
  logPrefix: string,
): Promise<void> {
  const uploadResult = await uploadToPresignedUrl(
    creation.putUrl,
    file,
    (percent) => callbacks?.onPageUploadProgress?.(creation.pageId, percent),
  );
  if (!uploadResult.success) {
    console.error(`[${logPrefix}] 上传页面失败:`, uploadResult.error);
    throw new Error(uploadResult.error);
  }

  const markResult = await updatePage(creation.pageId, {
    isUploaded: true,
    imageVersion: creation.imageVersion,
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
  const fileExtension = getUniformFileExtension(files);
  if (fileExtension === null) {
    const errorMessage = "所选文件后缀必须一致";
    console.error(`[${logPrefix}] 批量加页文件后缀不一致`, {
      chapterId,
      files: files.map((file) => file.name),
    });
    showToast(errorMessage, "error");
    throw new Error(errorMessage);
  }

  const reserveResult = await reserveChapterPages({
    chapterId,
    pageCount: files.length,
    fileExtension,
  });
  if (!reserveResult.success) {
    console.error(`[${logPrefix}] 预留页面失败:`, reserveResult.error);
    throw new Error(reserveResult.error);
  }

  const creations = reserveResult.data.creations;
  if (creations.length !== files.length) {
    throw new Error("预留页面数量与选择文件数量不一致");
  }

  callbacks?.onPagesReserved(
    creations.map((creation, index) => ({
      pageId: creation.pageId,
      index,
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
        await uploadOnePage(files[i], creations[i], callbacks, logPrefix);
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
