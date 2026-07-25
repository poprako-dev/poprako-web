import { useCallback, useRef, useState } from "react";
import JSZip from "jszip";
import { markCoverUploaded, reserveCoverUpload } from "@/features/ComicPlayground/api/comic";
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

type ShowToast = (message: string, type: ToastType) => void;

type Args = {
  accessToken: string | null;
  comicId: string;
  comicTitle: string;
  comicAuthor?: string | null;
  comicIndex?: number | null;
  comicCoverThumbnailUrl?: string | null;
  selectedChapterId: string | null;
  selectedChapter?: {
    index: number;
    subtitle?: string;
  };
  pages: PageInfo[];
  assignments: AssignmentInfo[];
  activeMember: MemberInfo | null;
  canUploadRawPages: boolean;
  onExportChapter?: ComicDetailModalProps["onExportChapter"];
  onExportChapterLp?: ComicDetailModalProps["onExportChapterLp"];
  onImportChapter?: ComicDetailModalProps["onImportChapter"];
  reloadCurrentPages: () => Promise<void>;
  reloadLoadedChapters: () => Promise<unknown>;
  showToast: ShowToast;
};

function sanitizeFileName(value: string) {
  return (
    (value || "")
      // eslint-disable-next-line no-control-regex
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
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
  switch (contentType?.split(";")[0].trim().toLowerCase()) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    case "image/avif":
      return "avif";
    case "image/bmp":
      return "bmp";
    case "image/tiff":
      return "tiff";
    default:
      return null;
  }
}

function getFileExtensionFromUrl(imageUrl: string) {
  try {
    const pathname = new URL(imageUrl).pathname;
    const match = pathname.match(/\.([a-zA-Z0-9]+)$/);
    return match?.[1]?.toLowerCase() ?? null;
  } catch {
    const normalized = imageUrl.split("?")[0]?.split("#")[0] ?? "";
    const match = normalized.match(/\.([a-zA-Z0-9]+)$/);
    return match?.[1]?.toLowerCase() ?? null;
  }
}

function appendDownloadCacheBuster(imageUrl: string) {
  const cacheBuster = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  try {
    const url = new URL(imageUrl);
    url.searchParams.set("_download_bust", cacheBuster);
    return url.toString();
  } catch {
    const hashIndex = imageUrl.indexOf("#");
    const base = hashIndex >= 0 ? imageUrl.slice(0, hashIndex) : imageUrl;
    const hash = hashIndex >= 0 ? imageUrl.slice(hashIndex) : "";
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
  selectedChapterId,
  selectedChapter,
  pages,
  assignments,
  activeMember,
  canUploadRawPages,
  onExportChapter,
  onExportChapterLp,
  onImportChapter,
  reloadCurrentPages,
  reloadLoadedChapters,
  showToast,
}: Args) {
  const [isImportingData, setIsImportingData] = useState(false);
  const [isExportingData, setIsExportingData] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgressState>(
    DEFAULT_EXPORT_PROGRESS,
  );
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverUploadProgress, setCoverUploadProgress] = useState<number | null>(null);
  const [localCoverUrl, setLocalCoverUrl] = useState<string | null>(null);
  const exportAbortControllerRef = useRef<AbortController | null>(null);

  const canUploadCover = (activeMember !== null && hasRole(activeMember, "admin")) || canUploadRawPages;

  const buildExportBaseName = useCallback(() => {
    const normalizedComicIndex = (comicIndex ?? 0) + 1;
    const chapterIndex = (selectedChapter?.index ?? 0) + 1;
    const author = comicAuthor || "未知作者";
    const title = comicTitle || "未命名漫画";
    const subtitle = selectedChapter?.subtitle || "";

    return sanitizeFileName(
      `【#${normalizedComicIndex}-${chapterIndex}】[${author}]${title}（${subtitle}）`,
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
    async (imageUrl: string, maxAttempts = 3): Promise<{ blob: Blob; extension: string } | null> => {
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        assertExportNotAborted();
        try {
          const downloadUrl = appendDownloadCacheBuster(imageUrl);
          const response = await fetch(downloadUrl, {
            cache: "no-store",
            headers: accessToken
              ? {
                  Authorization: `Bearer ${accessToken}`,
                }
              : undefined,
            signal: exportAbortControllerRef.current?.signal,
          });
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          const blob = await response.blob();
          const extension =
            getFileExtensionFromContentType(response.headers.get("content-type")) ??
            getFileExtensionFromUrl(imageUrl) ??
            "png";

          return { blob, extension };
        } catch (err) {
          if (err instanceof DOMException && err.name === "AbortError") {
            throw err;
          }
          if (attempt >= maxAttempts) {
            console.error("[ComicDetailModal] 下载图片失败，已跳过:", imageUrl, err);
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
    const pickNames = (predicate: (item: AssignmentInfo) => boolean) => {
      const uniqueNames = Array.from(
        new Set(
          assignments
            .filter(predicate)
            .map((item) => item.user?.name || item.userId)
            .filter((name) => !!name),
        ),
      );
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

  const handleExportData = useCallback(async (opts?: { includeImages?: boolean }) => {
    const includeImages = opts?.includeImages ?? true;
    if (!selectedChapterId || !onExportChapter || !onExportChapterLp) return;
    if (isExportingData) return;

    const abortController = new AbortController();
    exportAbortControllerRef.current = abortController;
    setIsExportingData(true);
    setExportProgress(DEFAULT_EXPORT_PROGRESS);

    try {
      setExportProgressStep("正在读取翻校数据", "正在请求 PRK 与 LP 导出内容。", 10);

      const [prkExportResult, lpExportResult] = await Promise.all([
        onExportChapter(selectedChapterId, { signal: abortController.signal }),
        onExportChapterLp(selectedChapterId, { signal: abortController.signal }),
      ]);

      assertExportNotAborted();

      if (!prkExportResult.success) {
        showToast(prkExportResult.error, "error");
        return;
      }

      if (!lpExportResult.success) {
        showToast(lpExportResult.error, "error");
        return;
      }

      const zip = new JSZip();
      let skippedImages = 0;

      if (includeImages) {
        const imageFolder = zip.folder("images");
        const totalPages = prkExportResult.data.pages.length;
        const imageUrlsByPageId = new Map(
          pages.map((page) => [page.id, page.imageUrl]),
        );
        let completedPages = 0;

        const pagesWithAssets = await Promise.all(
          prkExportResult.data.pages.map(async (page) => {
            assertExportNotAborted();

            const imageUrl = imageUrlsByPageId.get(page.pageId) ?? "";

            if (!imageUrl) {
              completedPages += 1;
              setExportProgressStep(
                "正在下载页面图片",
                `正在处理第 ${completedPages} / ${totalPages} 页图片。`,
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
              const imageFileName = `${String(page.pageIndex).padStart(3, "0")}.${imageFile.extension}`;
              imageFolder.file(imageFileName, imageFile.blob);
              completedPages += 1;
              setExportProgressStep(
                "正在下载页面图片",
                `正在处理第 ${completedPages} / ${totalPages} 页图片。`,
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
              `正在处理第 ${completedPages} / ${totalPages} 页图片。`,
              20 + (completedPages / Math.max(totalPages, 1)) * 60,
            );

            return { ...page, sourceImageUrl: imageUrl, exportedImagePath: null };
          }),
        );

        skippedImages = pagesWithAssets.filter(
          (page) => page.sourceImageUrl && !page.exportedImagePath,
        ).length;

        const payload = {
          ...prkExportResult.data,
          exportedAt: new Date().toISOString(),
          skippedImageCount: skippedImages,
          pages: pagesWithAssets.map(({ sourceImageUrl: _, ...page }) => page),
        };

        zip.file("translation.prk.json", JSON.stringify(payload, null, 2));
      } else {
        zip.file(
          "translation.prk.json",
          JSON.stringify(
            {
              ...prkExportResult.data,
              exportedAt: new Date().toISOString(),
            },
            null,
            2,
          ),
        );
      }

      zip.file("translation.lp.txt", lpExportResult.data);
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
      link.download = includeImages
        ? `${fileBaseName}.zip`
        : `${fileBaseName}-翻校数据.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);

      setExportProgressStep("下载完成", "文件已开始下载。", 100);

      if (includeImages && skippedImages > 0) {
        showToast(
          `导出完成，已打包图片、translation.prk.json、translation.lp.txt、assignments.txt，${skippedImages} 张图片下载失败后已跳过`,
          "error",
        );
        return;
      }
      showToast(
        includeImages
          ? "导出成功，已打包图片、translation.prk.json、translation.lp.txt、assignments.txt"
          : "导出成功，已打包 translation.prk.json、translation.lp.txt、assignments.txt",
        "success",
      );
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        showToast("下载已取消", "info");
        return;
      }
      console.error("[ComicDetailModal] 导出章节数据异常:", err);
      showToast("导出失败", "error");
    } finally {
      exportAbortControllerRef.current = null;
      setIsExportingData(false);
      setExportProgress(DEFAULT_EXPORT_PROGRESS);
    }
  }, [assertExportNotAborted, buildExportBaseName, fetchImageFileWithRetry, isExportingData, onExportChapter, onExportChapterLp, pages, selectedChapterId, setExportProgressStep, showToast, toAssignmentText]);

  const detectImportFormat = useCallback((file: File) => {
    const name = file.name.toLowerCase();
    if (name.endsWith(".json")) return "json" as const;
    if (name.endsWith(".txt")) return "lp" as const;
    return null;
  }, []);

  const handleImportFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = event.target.files?.[0];
      event.target.value = "";
      if (!selectedFile || !selectedChapterId || !onImportChapter) return;

      const format = detectImportFormat(selectedFile);
      if (!format) {
        showToast("仅支持 .json 或 .txt 文件", "error");
        return;
      }

      setIsImportingData(true);
      try {
        const content = await selectedFile.text();
        const result = await onImportChapter({
          chapterId: selectedChapterId,
          content,
          format,
        });

        if (!result.success) {
          showToast(result.error, "error");
          return;
        }

        await Promise.all([reloadCurrentPages(), reloadLoadedChapters()]);

        showToast(
          `导入成功：${result.data.importedPageCount} 页，${result.data.importedUnitCount} 单元`,
          "success",
        );
      } catch (err) {
        console.error("[ComicDetailModal] 导入章节数据异常:", err);
        showToast("导入失败", "error");
      } finally {
        setIsImportingData(false);
      }
    },
    [detectImportFormat, onImportChapter, reloadCurrentPages, reloadLoadedChapters, selectedChapterId, showToast],
  );

  const handleUploadCover = useCallback(
    async (file: File) => {
      if (isUploadingCover) return;

      const ext = getFileExtension(file);
      if (!ext) {
        showToast("请选择带后缀的图片文件", "error");
        return;
      }

      setIsUploadingCover(true);
      setCoverUploadProgress(0);

      try {
        const { imageHash } = await hashPageFile(file);
        const reserveRes = await reserveCoverUpload(comicId, {
          imageHash,
          newByteLen: file.size,
          extension: ext,
        });
        if (!reserveRes.success) {
          showToast(reserveRes.error, "error");
          return;
        }

        const slot = reserveRes.data;
        if (slot === null) {
          showToast("封面图片未发生变化", "success");
          return;
        }

        const uploadRes = await uploadToPresignedUrl(
          slot.putUrl,
          file,
          slot.headers,
          (percent) => setCoverUploadProgress(percent),
        );
        if (!uploadRes.success) {
          showToast(uploadRes.error, "error");
          return;
        }

        const markRes = await markCoverUploaded(
          comicId,
          slot.imageVersion,
        );
        if (!markRes.success) {
          showToast(markRes.error, "error");
          return;
        }

        setLocalCoverUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(file);
        });
        showToast("封面上传成功", "success");
      } catch (err) {
        console.error("[ComicDetailModal] 封面上传异常:", err);
        showToast(err instanceof Error ? err.message : "封面上传失败", "error");
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
      if (!file) return;
      void handleUploadCover(file);
    },
    [handleUploadCover],
  );

  return {
    isImportingData,
    isExportingData,
    exportProgress,
    canUploadCover,
    handleImportFileChange,
    handleExportData,
    coverUpload: {
      isUploadingCover,
      coverUploadProgress,
      localCoverUrl: localCoverUrl ?? comicCoverThumbnailUrl ?? null,
      handleCoverFileChange,
    } satisfies CoverUploadState,
    cancelExport: () => exportAbortControllerRef.current?.abort(),
  };
}
