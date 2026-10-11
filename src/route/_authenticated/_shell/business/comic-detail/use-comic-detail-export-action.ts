import { useCallback, useRef, useState } from "react";
import JSZip from "jszip";
import type { ApiClient } from "@/api/client";
import type { AssignmentInfo } from "@/route/_authenticated/business/assignment/assignment";
import type { ChapterExports } from "@/route/_authenticated/business/chapter/chapter-input";
import type { PageInfo } from "@/route/_authenticated/business/page/page";
import type { DetailContract, ExportProgressState } from "./comic-detail-type";
import { DEFAULT_EXPORT_PROGRESS } from "./comic-detail-type";
import { showLocalApiFailure, showLocalCaughtError } from "@/route/business/request-error";
import { fetchExportImageWithRetry } from "./export-image-download";
import { resolveArchiveImageNames } from "./export-image-names";
import { buildAssignmentExportText, buildComicDetailExportName } from "./export-format";
import type { ToastType } from "@/shared/component/notification-toast/notification-toast-type";

type ExportOptions = { includeImages?: boolean | undefined; withRawIdent?: boolean | undefined };
type ShowToast = (message: string, type: ToastType) => void;
type ExportActionArgs = {
  client: ApiClient;
  comicTitle: string;
  comicAuthor?: string | null | undefined;
  comicIndex?: number | null | undefined;
  selectedChapterId: string | null;
  selectedChapter?: { index: number; subtitle?: string | undefined } | undefined;
  pages: PageInfo[];
  assignments: AssignmentInfo[];
  onExportChapter?: DetailContract["onExportChapter"] | undefined;
  onWorkflowRecordsChanged: () => void;
  showToast: ShowToast;
};
type ProgressUpdate = (title: string, description: string, progress: number) => void;
type ExportContext = ExportActionArgs & {
  signal: AbortSignal;
  updateProgress: ProgressUpdate;
  assertNotAborted: () => void;
  completedPages: { value: number };
};
type ExportPage = ChapterExports["poprako"]["pages"][number] & {
  sourceImageUrl: string;
  exportedImagePath: string | null;
};

async function exportPage(
  context: ExportContext,
  page: ChapterExports["poprako"]["pages"][number],
  total: number,
  folder: JSZip,
  names: ReadonlyMap<string, string>,
  pageInfo: Map<string, PageInfo>,
): Promise<ExportPage> {
  context.assertNotAborted();
  const sourceImageUrl = pageInfo.get(page.pageId)?.imageUrl ?? "";
  const imageFile = sourceImageUrl
    ? await fetchExportImageWithRetry(sourceImageUrl, {
        client: context.client,
        signal: context.signal,
        assertNotAborted: context.assertNotAborted,
      })
    : null;
  context.assertNotAborted();
  const imageFileName = imageFile
    ? (names.get(page.pageId) ??
      `${String(page.pageIndex).padStart(3, "0")}.${imageFile.extension}`)
    : null;
  if (imageFile && imageFileName) folder.file(imageFileName, imageFile.blob);
  const completed = ++context.completedPages.value;
  context.updateProgress(
    "正在下载页面图片",
    `正在处理第 ${String(completed)} / ${String(total)} 页图片。`,
    20 + (completed / Math.max(total, 1)) * 60,
  );
  return {
    ...page,
    sourceImageUrl,
    exportedImagePath: imageFileName ? `images/${imageFileName}` : null,
  };
}

async function addPageImages(
  context: ExportContext,
  data: ChapterExports,
  zip: JSZip,
  withRawIdent: boolean,
): Promise<number> {
  const pageInfo = new Map(context.pages.map((page) => [page.id, page]));
  const rawIdentByPageId = new Map(data.rawIdents.map((item) => [item.pageId, item.rawIdent]));
  const names = withRawIdent
    ? resolveArchiveImageNames(
        data.poprako.pages.map((page) => ({
          pageId: page.pageId,
          defaultName: `${String(page.pageIndex).padStart(3, "0")}.${pageInfo.get(page.pageId)?.extension ?? "jpg"}`,
        })),
        rawIdentByPageId,
      )
    : new Map<string, string>();
  const folder = zip.folder("images");
  if (!folder) throw new Error("无法创建图片目录");
  context.completedPages.value = 0;
  const pages = await Promise.all(
    data.poprako.pages.map((page) =>
      exportPage(context, page, data.poprako.pages.length, folder, names, pageInfo),
    ),
  );
  const skippedImages = pages.filter(
    (page) => page.sourceImageUrl && !page.exportedImagePath,
  ).length;
  zip.file(
    "translation.prk.json",
    JSON.stringify(
      {
        ...data.poprako,
        exportedAt: new Date().toISOString(),
        skippedImageCount: skippedImages,
        pages: pages.map(({ sourceImageUrl: _sourceImageUrl, ...page }) => page),
      },
      null,
      2,
    ),
  );
  return skippedImages;
}

function addTextFiles(zip: JSZip, data: ChapterExports, assignments: AssignmentInfo[]): void {
  zip.file("translation.lp.txt", data.labelPlus);
  zip.file("assignments.txt", buildAssignmentExportText(assignments));
}

async function createZip(context: ExportContext, zip: JSZip): Promise<Blob> {
  context.updateProgress("正在压缩文件", "正在生成 ZIP 文件，请稍候。", 88);
  return await zip.generateAsync(
    { type: "blob", compression: "DEFLATE", streamFiles: true },
    (metadata) => {
      context.assertNotAborted();
      context.updateProgress(
        "正在压缩文件",
        "正在生成 ZIP 文件，请稍候。",
        88 + metadata.percent * 0.1,
      );
    },
  );
}

function saveZip(context: ExportContext, blob: Blob, includeImages: boolean): void {
  context.assertNotAborted();
  context.updateProgress("正在保存文件", "正在触发浏览器下载。", 99);
  const fileBaseName = buildComicDetailExportName({
    comicIndex: context.comicIndex,
    chapterIndex: context.selectedChapter?.index,
    author: context.comicAuthor,
    title: context.comicTitle,
    subtitle: context.selectedChapter?.subtitle,
  });
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = includeImages ? `${fileBaseName}.zip` : `${fileBaseName}-翻校数据.zip`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(downloadUrl);
  context.updateProgress("下载完成", "文件已开始下载。", 100);
}

function showExportResult(
  context: ExportContext,
  includeImages: boolean,
  skippedImages: number,
): void {
  if (includeImages && skippedImages > 0) {
    context.showToast(
      `导出完成，已打包图片、translation.prk.json、translation.lp.txt、assignments.txt，${String(skippedImages)} 张图片下载失败后已跳过`,
      "error",
    );
    return;
  }
  context.showToast(
    includeImages
      ? "导出成功，已打包图片、translation.prk.json、translation.lp.txt、assignments.txt"
      : "导出成功，已打包 translation.prk.json、translation.lp.txt、assignments.txt",
    "success",
  );
}

async function performExport(context: ExportContext, options: ExportOptions): Promise<void> {
  if (!context.selectedChapterId || !context.onExportChapter) return;
  context.updateProgress("正在读取翻校数据", "正在请求 PRK 与 LP 导出内容。", 10);
  const result = await context.onExportChapter(context.selectedChapterId, {
    signal: context.signal,
    withRawIdent: options.withRawIdent,
  });
  context.assertNotAborted();
  if (!result.success) {
    showLocalApiFailure(result, context.showToast);
    return;
  }
  context.onWorkflowRecordsChanged();
  const zip = new JSZip();
  const skippedImages = options.includeImages
    ? await addPageImages(context, result.data, zip, options.withRawIdent ?? false)
    : 0;
  if (!options.includeImages)
    zip.file(
      "translation.prk.json",
      JSON.stringify(
        {
          ...result.data.poprako,
          exportedAt: new Date().toISOString(),
        },
        null,
        2,
      ),
    );
  addTextFiles(zip, result.data, context.assignments);
  const blob = await createZip(context, zip);
  context.assertNotAborted();
  saveZip(context, blob, options.includeImages ?? true);
  showExportResult(context, options.includeImages ?? true, skippedImages);
}

type ExportActionState = {
  isExportingData: boolean;
  exportProgress: ExportProgressState;
  handleExportData: (options?: ExportOptions) => Promise<void>;
  cancelExport: () => void;
};

export function useComicDetailExportAction(args: ExportActionArgs): ExportActionState {
  const [isExportingData, setIsExportingData] = useState(false);
  const [exportProgress, setExportProgress] =
    useState<ExportProgressState>(DEFAULT_EXPORT_PROGRESS);
  const abortRef = useRef<AbortController | null>(null);
  const setStep = useCallback((title: string, description: string, progress: number): void => {
    setExportProgress({ title, description, progress: Math.max(0, Math.min(progress, 100)) });
  }, []);
  const assertNotAborted = useCallback(() => {
    if (abortRef.current?.signal.aborted) throw new DOMException("下载已取消", "AbortError");
  }, []);
  const handleExportData = useCallback(
    async (options?: ExportOptions) => {
      if (!args.selectedChapterId || !args.onExportChapter || isExportingData) return;
      const controller = new AbortController();
      abortRef.current = controller;
      setIsExportingData(true);
      setExportProgress(DEFAULT_EXPORT_PROGRESS);
      try {
        await performExport(
          {
            ...args,
            signal: controller.signal,
            updateProgress: setStep,
            assertNotAborted,
            completedPages: { value: 0 },
          },
          {
            includeImages: options?.includeImages ?? true,
            withRawIdent: options?.withRawIdent ?? false,
          },
        );
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError")
          args.showToast("下载已取消", "info");
        else {
          console.error("[ComicDetailModal] 导出章节数据异常:", error);
          showLocalCaughtError(error, args.showToast, "导出失败");
        }
      } finally {
        abortRef.current = null;
        setIsExportingData(false);
        setExportProgress(DEFAULT_EXPORT_PROGRESS);
      }
    },
    [args, assertNotAborted, isExportingData, setStep],
  );
  const cancelExport = useCallback(() => abortRef.current?.abort(), []);
  return { isExportingData, exportProgress, handleExportData, cancelExport };
}
