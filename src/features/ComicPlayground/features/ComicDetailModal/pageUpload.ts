import { reserveChapterPages, updatePage, uploadToPresignedUrl } from "@/features/ComicPlayground/api/page";
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
};

export async function addChapterPages({
  chapterId,
  files,
  callbacks,
  showToast,
  logPrefix,
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

  callbacks?.onPagesReserved(creations.map((creation, index) => ({
    pageId: creation.pageId,
    index,
  })));

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const creation = creations[i];

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
}
