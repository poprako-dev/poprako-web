import { useCallback } from "react";
import { showLocalCaughtError } from "@/route/business/request-error";

import {
  startChapterPageUpload,
  startPageReupload,
} from "@/route/_authenticated/_shell/business/comic-detail/upload/page-upload";

import type { usePageResults } from "./use-page-results";
import type { useApiClient } from "@/route/business/api-context";

import type { ComicDetailPagesArgs as Args, PageState } from "./use-comic-detail-pages";
type Results = ReturnType<typeof usePageResults>;
type Client = ReturnType<typeof useApiClient>;

export function useAddRawPages(
  client: Client,
  args: Args,
  capture: Results["capture"],
): PageState["handleAddRawPages"] {
  const { chapterId, showToast } = args;
  const handleAddRawPages = useCallback(
    async (files: File[]): Promise<void> => {
      if (!chapterId) return;

      const isCurrent = capture();
      try {
        const started = await startChapterPageUpload(client, chapterId, files);
        if (isCurrent() && started.skippedCount > 0) {
          showToast(
            `已跳过 ${String(started.skippedCount)} 张重复图片，` +
              `开始上传 ${String(started.allocatedCount)} 张`,
            "info",
          );
        }

        void started.completion.then((summary) => {
          if (!isCurrent()) return;
          const unreportedFailures = summary.failed - summary.reportedValidationFailures;
          if (unreportedFailures > 0) {
            showToast(`${String(unreportedFailures)} 张图片上传失败，可在对应页面重传`, "error");
          }
        });
      } catch (error) {
        if (!isCurrent()) return;
        console.error("[ComicDetailModal] 分配页面失败:", error);
        showLocalCaughtError(error, showToast, "分配页面失败", true);
      }
    },
    [chapterId, client, capture, showToast],
  );

  return handleAddRawPages;
}

export function useReuploadPage(
  client: Client,
  args: Args,
  capture: Results["capture"],
  reuploadingPageIds: PageState["reuploadingPageIds"],
): PageState["handleReuploadPage"] {
  const { chapterId, showToast } = args;
  const handleReuploadPage = useCallback(
    async (pageId: string, file: File) => {
      if (!chapterId || reuploadingPageIds[pageId] === true) return;

      const isCurrent = capture();
      try {
        const started = await startPageReupload(client, chapterId, pageId, file);
        void started.completion.then((summary) => {
          if (!isCurrent()) return;
          if (summary.succeeded > 0) {
            showToast("重上传成功", "success");
            return;
          }
          if (summary.reportedValidationFailures > 0) return;
          showToast("重上传失败，请检查对应页面", "error");
        });
      } catch (error) {
        if (!isCurrent()) return;
        console.error("[ComicDetailModal] 重上传分配失败:", error);
        showLocalCaughtError(error, showToast, "重上传失败", true);
      }
    },
    [chapterId, client, capture, reuploadingPageIds, showToast],
  );

  return handleReuploadPage;
}
