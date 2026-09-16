import { useCallback, useRef, useState } from "react";
import JSZip from "jszip";
import {
  createHttpFailure,
  showLocalApiFailure,
  showLocalCaughtError,
  toApiRequestError,
} from "@/api/util";
import { markCoverUploaded, allocCoverUpload } from "@/features/ComicPlayground/api/comic";
import { uploadToPresignedUrl } from "@/features/ComicPlayground/api/page";
import { hashPageFile } from "../pageHash";
import { hasRole } from "@/types/role";
import type { AssignmentInfo } from "@/types/assignment";
import type { MemberInfo } from "@/types/member";
import type { PageInfo } from "@/types/page";
import type { ToastType } from "@/components/ui/NotificationToast";
import type {
  ComicDetailModalProps,
  CoverUploadState,
  ExportProgressState,
} from "../types";
import { DEFAULT_EXPORT_PROGRESS } from "../types";
import { getFileExtension } from "../utils";
import { resolveComicDetailCoverUrl } from "../coverUrl";
import { resolveArchiveImageNames } from "../exportImageNames";
import type { ImportChapterMode } from "../../../types/chapter";

type ShowToast = (message: string, type: ToastType) => void;

interface Args {
  accessToken: string | null;
  comicId: string;
  comicTitle: string;
  comicAuthor?: string | null | undefined;
  comicIndex?: number | null | undefined;
  comicCoverThumbnailUrl?: string | null | undefined;
  isCoverUploaded: boolean;
  selectedChapterId: string | null;
  selectedChapter?: {
    index: number;
    subtitle?: string | undefined;
  } | undefined;
  pages: PageInfo[];
  assignments: AssignmentInfo[];
  activeMember: MemberInfo | null;
  canUploadRawPages: boolean;
  onExportChapter?: ComicDetailModalProps["onExportChapter"] | undefined;
  onImportChapter: ComicDetailModalProps["onImportChapter"];
  reloadCurrentPages: () => Promise<void>;
  reloadLoadedChapters: () => Promise<unknown>;
  onWorkflowRecordsChanged?: (() => void) | undefined;
  showToast: ShowToast;
}

function sanitizeFileName(value: string) {
  return (
    (value || "")
      // eslint-disable-next-line no-control-regex
      .replaceAll(/[<>:"/\\|?*\u{0}-\u{1F}]/gu, "_")
      .trim()
      .slice(0, 120) || "chapter-export"
  );
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getFileExtensionFromContentType(contentType: string | null) {
  switch (contentType?.split(";", 1)[0]?.trim().toLowerCase()) {
    case undefined: {
      return null;
    }
    case "image/jpeg": {
      return "jpg";
    }
    case "image/png": {
      return "png";
    }
    case "image/webp": {
      return "webp";
    }
    case "image/gif": {
      return "gif";
    }
    case "image/avif": {
      return "avif";
    }
    case "image/bmp": {
      return "bmp";
    }
    case "image/tiff": {
      return "tiff";
    }
    default: {
      return null;
    }
  }
}

function getFileExtensionFromUrl(imageUrl: string) {
  try {
    const pathname = new URL(imageUrl).pathname;
    const match = /\.([a-zA-Z0-9]+)$/.exec(pathname);
    return match?.[1]?.toLowerCase() ?? null;
  } catch {
    const normalized = imageUrl.split("?", 1)[0]?.split("#", 1)[0] ?? "";
    const match = /\.([a-zA-Z0-9]+)$/.exec(normalized);
    return match?.[1]?.toLowerCase() ?? null;
  }
}

function appendDownloadCacheBuster(imageUrl: string) {
  const cacheBuster = `${String(Date.now())}-${Math.random().toString(36).slice(2)}`;

  try {
    const url = new URL(imageUrl);
    url.searchParams.set("_download_bust", cacheBuster);
    return url.href;
  } catch {
    const hashIndex = imageUrl.indexOf("#");
    const base = hashIndex === -1 ? imageUrl : imageUrl.slice(0, hashIndex);
    const hash = hashIndex === -1 ? "" : imageUrl.slice(hashIndex);
    const separator = base.includes("?") ? "&" : "?";
    return `${base}${separator}_download_bust=${encodeURIComponent(cacheBuster)}${hash}`;
  }
}

export function useComicDetailExport({
  accessToken,
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
}: Args) {
  const [isImportingData, setIsImportingData] = useState(false);
  const [pendingImport, setPendingImport] = useState<{
    file: File;
    chapterId: string;
  } | null>(null);
  const importInFlightRef = useRef(false);
  const [isExportingData, setIsExportingData] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgressState>(
    DEFAULT_EXPORT_PROGRESS,
  );
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverUploadProgress, setCoverUploadProgress] = useState<number | null>(null);
  const [localCoverUrl, setLocalCoverUrl] = useState<string | null>(null);
  const exportAbortControllerRef = useRef<AbortController | null>(null);

  const canUploadCover =
    (activeMember !== null && hasRole(activeMember, "admin")) ||
    canUploadRawPages;
  const displayedCoverUrl = resolveComicDetailCoverUrl({
    isCoverUploaded,
    comicCoverThumbnailUrl,
    selectedChapterIndex: selectedChapter?.index,
    pages,
  });

  const buildExportBaseName = useCallback(() => {
    const normalizedComicIndex = (comicIndex ?? 0) + 1;
    const chapterIndex = (selectedChapter?.index ?? 0) + 1;
    const author = comicAuthor ?? "未知作者";
    const title = comicTitle;
    const subtitle = selectedChapter?.subtitle ?? "";

    return sanitizeFileName(
      `【#${String(normalizedComicIndex)}-${String(chapterIndex)}】[${author}]${title}（${subtitle}）`,
    );
  }, [comicAuthor, comicIndex, comicTitle, selectedChapter?.index, selectedChapter?.subtitle]);

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

  const fetchImageFileWithRetry = useCallback(
    async (
      imageUrl: string,
      maxAttempts = 3,
    ): Promise<{ blob: Blob; extension: string } | null> => {
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        assertExportNotAborted();
        try {
          const downloadUrl = appendDownloadCacheBuster(imageUrl);
          const response = await fetch(downloadUrl, {
            cache: "no-store",
            ...(accessToken && {
              headers: { Authorization: `Bearer ${accessToken}` },
            }),
            ...(exportAbortControllerRef.current && {
              signal: exportAbortControllerRef.current.signal,
            }),
          });
          if (!response.ok) {
            const responseText = await response.text();
            let message = responseText || response.statusText || `HTTP ${String(response.status)}`;
            try {
              const body = JSON.parse(responseText) as { message?: unknown };
              if (typeof body.message === "string") {message = body.message;}
            } catch {
              const xmlMessage = /<Message>([^<]+)<\/Message>/.exec(responseText);
              if (xmlMessage?.[1]) {message = xmlMessage[1];}
            }
            throw toApiRequestError(createHttpFailure(message, response.status));
          }
          const blob = await response.blob();
          const extension =
            getFileExtensionFromContentType(response.headers.get("content-type")) ??
            getFileExtensionFromUrl(imageUrl) ??
            "png";

          return { blob, extension };
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            throw error;
          }
          if (attempt >= maxAttempts) {
            console.error( // eslint-disable-line no-console -- report skipped download.
              "[ComicDetailModal] 下载图片失败，已跳过:", imageUrl, error,
            );
            return null;
          }
          await wait(300 * attempt);
        }
      }
      return null;
    },
    [accessToken, assertExportNotAborted],
  );

  const toAssignmentText = useCallback(() => {
    const pickNames = (isMatch: (item: AssignmentInfo) => boolean) => {
      const uniqueNames = [...new Set(
          assignments
            .filter((item) => isMatch(item))
            .map((item) => item.user?.name ?? item.userId)
            .filter(Boolean),
        )];
      return uniqueNames.join("、");
    };

    const rows = [
      `【图源】${pickNames((item) => hasRole(item, "rawProvider"))}`,
      `【翻译】${pickNames((item) => hasRole(item, "translator"))}`,
      `【校对】${pickNames((item) => hasRole(item, "proofreader"))}`,
      `【嵌字】${pickNames((item) => hasRole(item, "typesetter") || hasRole(item, "redrawer"))}`,
      `【监修】${pickNames((item) => hasRole(item, "reviewer"))}`,
      `【上传】${pickNames((item) => hasRole(item, "publisher"))}`,
    ];

    return rows.join("\n");
  }, [assignments]);

  const handleExportData = useCallback(async (opts?: {
    includeImages?: boolean | undefined;
    withRawIdent?: boolean | undefined;
  }) => {
    if (!selectedChapterId || !onExportChapter) {return;}
    if (isExportingData) {return;}
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
      const rawIdentByPageId = new Map(
        rawIdents.map((item) => [item.pageId, item.rawIdent]),
      );
      const archiveImageNamesByPageId = shouldUseRawIdent
        ? resolveArchiveImageNames(imageNameInputs, rawIdentByPageId)
        : new Map<string, string>();

      onWorkflowRecordsChanged?.();

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

            const imageFile = await fetchImageFileWithRetry(imageUrl, 3);
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

            return { ...page, sourceImageUrl: imageUrl, exportedImagePath: null };
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
      zip.file("assignments.txt", toAssignmentText());

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

      const fileBaseName = buildExportBaseName();

      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = isIncludeImages
        ? `${fileBaseName}.zip`
        : `${fileBaseName}-翻校数据.zip`;
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
      console.error("[ComicDetailModal] 导出章节数据异常:", error); // eslint-disable-line no-console
      showLocalCaughtError(error, showToast, "导出失败");
    } finally {
      exportAbortControllerRef.current = null;
      setIsExportingData(false);
      setExportProgress(DEFAULT_EXPORT_PROGRESS);
    }
  }, [
    assertExportNotAborted,
    buildExportBaseName,
    fetchImageFileWithRetry,
    isExportingData,
    onExportChapter,
    onWorkflowRecordsChanged,
    pages,
    selectedChapterId,
    setExportProgressStep,
    showToast,
    toAssignmentText,
  ]);

  const detectImportFormat = useCallback((file: File) => {
    const name = file.name.toLowerCase();
    if (name.endsWith(".json")) {return "json" as const;}
    if (name.endsWith(".txt")) {return "lp" as const;}
    return null;
  }, []);

  const handleImportFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = event.target.files?.[0];
      event.target.value = "";
      if (!selectedFile || !selectedChapterId) {return;}
      if (importInFlightRef.current) {return;}

      const format = detectImportFormat(selectedFile);
      if (!format) {
        showToast("仅支持 .json 或 .txt 文件", "error");
        return;
      }

      setPendingImport({ file: selectedFile, chapterId: selectedChapterId });
    },
    [detectImportFormat, selectedChapterId, showToast],
  );

  const cancelImport = useCallback(() => {
    if (!importInFlightRef.current) {setPendingImport(null);}
  }, []);

  const confirmImport = useCallback(
    async (mode: ImportChapterMode) => {
      if (!pendingImport || importInFlightRef.current) {return;}
      const format = detectImportFormat(pendingImport.file);
      if (!format) {return;}
      importInFlightRef.current = true;
      setIsImportingData(true);
      try {
        const content = await pendingImport.file.text();
        const result = await onImportChapter({
          chapterId: pendingImport.chapterId,
          content,
          format,
          mode,
        });

        if (!result.success) {
          showLocalApiFailure(result, showToast);
          return;
        }

        setPendingImport(null);
        await Promise.all([reloadCurrentPages(), reloadLoadedChapters()]);
        onWorkflowRecordsChanged?.();

        showToast(
          `导入成功：${String(result.data.importedPageCount)} 页，`
          + `${String(result.data.importedUnitCount)} 单元`,
          "success",
        );
      } catch (error) {
        console.error("[ComicDetailModal] 导入章节数据异常:", error); // eslint-disable-line no-console
        showLocalCaughtError(error, showToast, "导入失败");
      } finally {
        importInFlightRef.current = false;
        setIsImportingData(false);
      }
    },
    [
      detectImportFormat,
      onImportChapter,
      onWorkflowRecordsChanged,
      reloadCurrentPages,
      reloadLoadedChapters,
      pendingImport,
      showToast,
    ],
  );

  const handleUploadCover = useCallback(
    async (file: File) => {
      if (isUploadingCover) {return;}

      const ext = getFileExtension(file);
      if (!ext) {
        showToast("请选择带后缀的图片文件", "error");
        return;
      }

      setIsUploadingCover(true);
      setCoverUploadProgress(0);

      try {
        const { imageHash } = await hashPageFile(file);
        const allocRes = await allocCoverUpload(comicId, {
          imageHash,
          newByteLen: file.size,
          extension: ext,
        });
        if (!allocRes.success) {
          showLocalApiFailure(allocRes, showToast);
          return;
        }

        const slot = allocRes.data;
        if (slot === null) {
          showToast("封面图片未发生变化", "success");
          return;
        }

        const uploadRes = await uploadToPresignedUrl(
          slot.putUrl,
          file,
          slot.headers,
          (percent) => { setCoverUploadProgress(percent); },
        );
        if (!uploadRes.success) {
          showLocalApiFailure(uploadRes, showToast);
          return;
        }

        const markRes = await markCoverUploaded(
          comicId,
          slot.imageVersion,
        );
        if (!markRes.success) {
          showLocalApiFailure(markRes, showToast);
          return;
        }

        setLocalCoverUrl((prev) => {
          if (prev) {URL.revokeObjectURL(prev);}
          return URL.createObjectURL(file);
        });
        showToast("封面上传成功", "success");
      } catch (error) {
        console.error("[ComicDetailModal] 封面上传异常:", error); // eslint-disable-line no-console
        showLocalCaughtError(error, showToast, "封面上传失败", true);
      } finally {
        setIsUploadingCover(false);
        setCoverUploadProgress(null);
      }
    },
    [comicId, isUploadingCover, showToast],
  );

  const handleCoverFileChange: CoverUploadState["handleCoverFileChange"] = useCallback(
    (event) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) {return;}
      void handleUploadCover(file);
    },
    [handleUploadCover],
  );

  return {
    pendingImport,
    confirmImport,
    cancelImport,
    isImportingData,
    isExportingData,
    exportProgress,
    canUploadCover,
    handleImportFileChange,
    handleExportData,
    coverUpload: {
      isUploadingCover,
      coverUploadProgress,
      localCoverUrl: localCoverUrl ?? displayedCoverUrl,
      handleCoverFileChange,
    } satisfies CoverUploadState,
    cancelExport: () => exportAbortControllerRef.current?.abort(),
  };
}
