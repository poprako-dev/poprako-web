import { useCallback, useRef, useState } from "react";
import { showLocalCaughtError } from "@/route/business/request-error";
import type { ExportProgressState } from "./comic-detail-type";
import { DEFAULT_EXPORT_PROGRESS } from "./comic-detail-type";
import { performComicDetailExport } from "./comic-detail-export";
import type { ExportActionArgs, ExportContext, ExportOptions } from "./comic-detail-export-types";

type ExportActionState = {
  isExportingData: boolean;
  exportProgress: ExportProgressState;
  handleExportData: (options?: ExportOptions) => Promise<void>;
  cancelExport: () => void;
};

async function runExport(context: ExportContext, options?: ExportOptions): Promise<void> {
  try {
    await performComicDetailExport(context, {
      includeImages: options?.includeImages ?? true,
      withRawIdent: options?.withRawIdent ?? false,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError")
      context.showToast("下载已取消", "info");
    else {
      console.error("[ComicDetailModal] 导出章节数据异常:", error);
      showLocalCaughtError(error, context.showToast, "导出失败，请重试");
    }
  }
}

export function useComicDetailExportAction(args: ExportActionArgs): ExportActionState {
  const [isExportingData, setIsExportingData] = useState(false);
  const [exportProgress, setExportProgress] =
    useState<ExportProgressState>(DEFAULT_EXPORT_PROGRESS);
  const abortRef = useRef<AbortController | null>(null);
  const handleExportData = useCallback(
    async (options?: ExportOptions) => {
      if (!args.selectedChapterId || !args.onExportChapter || abortRef.current) return;
      const controller = new AbortController();
      abortRef.current = controller;
      setIsExportingData(true);
      setExportProgress(DEFAULT_EXPORT_PROGRESS);
      try {
        await runExport(
          {
            ...args,
            signal: controller.signal,
            updateProgress: (title, description, progress) => {
              setExportProgress({
                title,
                description,
                progress: Math.max(0, Math.min(progress, 100)),
              });
            },
            assertNotAborted: () => {
              controller.signal.throwIfAborted();
            },
            completedPages: { value: 0 },
          },
          options,
        );
      } finally {
        abortRef.current = null;
        setIsExportingData(false);
        setExportProgress(DEFAULT_EXPORT_PROGRESS);
      }
    },
    [args],
  );
  const cancelExport = useCallback(() => abortRef.current?.abort(), []);
  return { isExportingData, exportProgress, handleExportData, cancelExport };
}
