import { useApiClient } from "@/route/business/api-context";
import { useCallback, useRef, useState } from "react";
import JSZip from "jszip";
import { showLocalApiFailure, showLocalCaughtError } from "@/route/business/request-error";
import type { AssignmentInfo } from "@/route/_authenticated/business/assignment/assignment";
import type { PageInfo } from "@/route/_authenticated/business/page/page";
import type { MemberInfo } from "@/route/business/identity/member";
import type { ToastType } from "@/shared/component/notification-toast/notification-toast-type";
import type { CoverUploadState } from "@/route/_authenticated/_shell/business/comic-detail/comic-detail-type";
import type {
  DetailContract,
  ExportProgressState,
} from "@/route/_authenticated/_shell/business/comic-detail/comic-detail-type";
import { DEFAULT_EXPORT_PROGRESS } from "@/route/_authenticated/_shell/business/comic-detail/comic-detail-type";
import { resolveArchiveImageNames } from "@/route/_authenticated/_shell/business/comic-detail/export-image-names";
import { useComicDetailCoverUpload } from "@/route/_authenticated/_shell/business/comic-detail/use-comic-detail-cover-upload";
import { useComicDetailImport } from "@/route/_authenticated/_shell/business/comic-detail/use-comic-detail-import";
import { fetchExportImageWithRetry } from "@/route/_authenticated/_shell/business/comic-detail/export-image-download";
import {
  buildAssignmentExportText,
  buildComicDetailExportName,
} from "@/route/_authenticated/_shell/business/comic-detail/export-format";

type ShowToast = (message: string, type: ToastType) => void;

type Args = {
  comicId: string;
  comicTitle: string;
  comicAuthor?: string | null | undefined;
  comicIndex?: number | null | undefined;
  comicCoverThumbnailUrl?: string | null | undefined;
  isCoverUploaded: boolean;
  selectedChapterId: string | null;
  selectedChapter?:
    | {
        index: number;
        subtitle?: string | undefined;
      }
    | undefined;
  pages: PageInfo[];
  assignments: AssignmentInfo[];
  activeMember: MemberInfo | null;
  canUploadRawPages: boolean;
  onExportChapter?: DetailContract["onExportChapter"] | undefined;
  onImportChapter: DetailContract["onImportChapter"];
  reloadCurrentPages: () => Promise<void>;
  reloadLoadedChapters: () => Promise<void>;
  onWorkflowRecordsChanged: () => void;
  showToast: ShowToast;
};

type ExportOptions = {
  includeImages?: boolean | undefined;
  withRawIdent?: boolean | undefined;
};

type ComicDetailExportState = ReturnType<typeof useComicDetailImport> & {
  isExportingData: boolean;
  exportProgress: ExportProgressState;
  canUploadCover: boolean;
  handleExportData: (options?: ExportOptions) => Promise<void>;
  coverUpload: CoverUploadState;
  cancelExport: () => void;
};

export function useComicDetailExport({
  comicId,
  comicTitle,
  comicAuthor,
  comicIndex,
  comicCoverThumbnailUrl,
  isCoverUploaded,
  selectedChapterId,
  selectedChapter,
  pages,
  assignments,
  activeMember,
  canUploadRawPages,
  onExportChapter,
  onImportChapter,
  reloadCurrentPages,
  reloadLoadedChapters,
  onWorkflowRecordsChanged,
  showToast,
}: Args): ComicDetailExportState {
  const client = useApiClient();
  const importState = useComicDetailImport({
    selectedChapterId,
    onImportChapter,
    reloadCurrentPages,
    reloadLoadedChapters,
    onWorkflowRecordsChanged,
    showToast,
  });
  const [isExportingData, setIsExportingData] = useState(false);
  const [exportProgress, setExportProgress] =
    useState<ExportProgressState>(DEFAULT_EXPORT_PROGRESS);
  const exportAbortControllerRef = useRef<AbortController | null>(null);
  const { canUploadCover, coverUpload } = useComicDetailCoverUpload({
    comicId,
    isCoverUploaded,
    comicCoverThumbnailUrl,
    selectedChapterIndex: selectedChapter?.index,
    pages,
    activeMember,
    canUploadRawPages,
    showToast,
  });

  const setExportProgressStep = useCallback(
    (title: string, description: string, progress: number) => {
      setExportProgress({
        title,
        description,
        progress: Math.max(0, Math.min(progress, 100)),
      });
    },
    [],
  );

  const assertExportNotAborted = useCallback(() => {
    if (exportAbortControllerRef.current?.signal.aborted) {
      throw new DOMException("下载已取消", "AbortError");
    }
  }, []);

  const handleExportData = useCallback(
    async (opts?: ExportOptions) => {
      if (!selectedChapterId || !onExportChapter) return;
      if (isExportingData) return;
      const isIncludeImages = opts?.includeImages ?? true;
      const shouldUseRawIdent = opts?.withRawIdent ?? false;

      const abortController = new AbortController();
      exportAbortControllerRef.current = abortController;
      setIsExportingData(true);
      setExportProgress(DEFAULT_EXPORT_PROGRESS);

      try {
        setExportProgressStep("正在读取翻校数据", "正在请求 PRK 与 LP 导出内容。", 10);

        const exportResult = await onExportChapter(selectedChapterId, {
          signal: abortController.signal,
          withRawIdent: shouldUseRawIdent,
        });

        assertExportNotAborted();

        if (!exportResult.success) {
          showLocalApiFailure(exportResult, showToast);
          return;
        }

        const { labelPlus, poprako, rawIdents } = exportResult.data;
        const pageInfoById = new Map(pages.map((page) => [page.id, page]));
        const imageNameInputs = poprako.pages.map((page) => {
          const extension = pageInfoById.get(page.pageId)?.extension ?? "jpg";
          return {
            pageId: page.pageId,
            defaultName: `${String(page.pageIndex).padStart(3, "0")}.${extension}`,
          };
        });
        const rawIdentByPageId = new Map(rawIdents.map((item) => [item.pageId, item.rawIdent]));
        const archiveImageNamesByPageId = shouldUseRawIdent
          ? resolveArchiveImageNames(imageNameInputs, rawIdentByPageId)
          : new Map<string, string>();

        onWorkflowRecordsChanged();

        const zip = new JSZip();
        let skippedImages = 0;

        if (isIncludeImages) {
          const imageFolder = zip.folder("images");
          const totalPages = poprako.pages.length;
          let completedPages = 0;

          const pagesWithAssets = await Promise.all(
            poprako.pages.map(async (page) => {
              assertExportNotAborted();

              const imageUrl = pageInfoById.get(page.pageId)?.imageUrl ?? "";

              if (!imageUrl) {
                completedPages += 1;
                setExportProgressStep(
                  "正在下载页面图片",
                  `正在处理第 ${String(completedPages)} / ${String(totalPages)} 页图片。`,
                  20 + (completedPages / Math.max(totalPages, 1)) * 60,
                );
                return {
                  ...page,
                  sourceImageUrl: imageUrl,
                  exportedImagePath: null as string | null,
                };
              }

              const imageFile = await fetchExportImageWithRetry(imageUrl, {
                client,
                signal: abortController.signal,
                assertNotAborted: assertExportNotAborted,
              });
              assertExportNotAborted();

              if (imageFile && imageFolder) {
                const imageFileName =
                  archiveImageNamesByPageId.get(page.pageId) ??
                  `${String(page.pageIndex).padStart(3, "0")}.${imageFile.extension}`;
                imageFolder.file(imageFileName, imageFile.blob);
                completedPages += 1;
                setExportProgressStep(
                  "正在下载页面图片",
                  `正在处理第 ${String(completedPages)} / ${String(totalPages)} 页图片。`,
                  20 + (completedPages / Math.max(totalPages, 1)) * 60,
                );

                return {
                  ...page,
                  sourceImageUrl: imageUrl,
                  exportedImagePath: `images/${imageFileName}`,
                };
              }

              completedPages += 1;
              setExportProgressStep(
                "正在下载页面图片",
                `正在处理第 ${String(completedPages)} / ${String(totalPages)} 页图片。`,
                20 + (completedPages / Math.max(totalPages, 1)) * 60,
              );

              return {
                ...page,
                sourceImageUrl: imageUrl,
                exportedImagePath: null,
              };
            }),
          );

          skippedImages = pagesWithAssets.filter(
            (page) => page.sourceImageUrl && !page.exportedImagePath,
          ).length;

          const payload = {
            ...poprako,
            exportedAt: new Date().toISOString(),
            skippedImageCount: skippedImages,
            pages: pagesWithAssets.map((pageWithImage) => {
              const { sourceImageUrl: _sourceImageUrl, ...page } = pageWithImage;
              return page;
            }),
          };

          zip.file("translation.prk.json", JSON.stringify(payload, null, 2));
        } else {
          zip.file(
            "translation.prk.json",
            JSON.stringify(
              {
                ...poprako,
                exportedAt: new Date().toISOString(),
              },
              null,
              2,
            ),
          );
        }

        zip.file("translation.lp.txt", labelPlus);
        zip.file("assignments.txt", buildAssignmentExportText(assignments));

        setExportProgressStep("正在压缩文件", "正在生成 ZIP 文件，请稍候。", 88);

        const blob = await zip.generateAsync(
          {
            type: "blob",
            compression: "DEFLATE",
            streamFiles: true,
          },
          (metadata) => {
            assertExportNotAborted();
            setExportProgressStep(
              "正在压缩文件",
              "正在生成 ZIP 文件，请稍候。",
              88 + metadata.percent * 0.1,
            );
          },
        );

        assertExportNotAborted();

        setExportProgressStep("正在保存文件", "正在触发浏览器下载。", 99);

        const fileBaseName = buildComicDetailExportName({
          comicIndex,
          chapterIndex: selectedChapter?.index,
          author: comicAuthor,
          title: comicTitle,
          subtitle: selectedChapter?.subtitle,
        });

        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = isIncludeImages ? `${fileBaseName}.zip` : `${fileBaseName}-翻校数据.zip`;
        document.body.append(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(downloadUrl);

        setExportProgressStep("下载完成", "文件已开始下载。", 100);

        if (isIncludeImages && skippedImages > 0) {
          showToast(
            "导出完成，已打包图片、translation.prk.json、translation.lp.txt、" +
              `assignments.txt，${String(skippedImages)} 张图片下载失败后已跳过`,
            "error",
          );
          return;
        }
        showToast(
          isIncludeImages
            ? "导出成功，已打包图片、translation.prk.json、translation.lp.txt、assignments.txt"
            : "导出成功，已打包 translation.prk.json、translation.lp.txt、assignments.txt",
          "success",
        );
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          showToast("下载已取消", "info");
          return;
        }
        console.error("[ComicDetailModal] 导出章节数据异常:", error);
        showLocalCaughtError(error, showToast, "导出失败");
      } finally {
        exportAbortControllerRef.current = null;
        setIsExportingData(false);
        setExportProgress(DEFAULT_EXPORT_PROGRESS);
      }
    },
    [
      client,
      assignments,
      assertExportNotAborted,
      comicAuthor,
      comicIndex,
      comicTitle,
      isExportingData,
      onExportChapter,
      onWorkflowRecordsChanged,
      pages,
      selectedChapter,
      selectedChapterId,
      setExportProgressStep,
      showToast,
    ],
  );

  return {
    ...importState,
    isExportingData,
    exportProgress,
    canUploadCover,
    handleExportData,
    coverUpload,
    cancelExport: () => exportAbortControllerRef.current?.abort(),
  };
}
