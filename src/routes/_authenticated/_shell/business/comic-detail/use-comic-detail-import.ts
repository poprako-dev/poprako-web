import { useCallback, useRef, useState } from "react";
import { showLocalApiFailure, showLocalCaughtError } from "@/routes/business/request";
import type { ToastType } from "@/shared/component/notification-toast/notification-toast-type";
import type { ComicDetailModalProps } from "@/routes/_authenticated/_shell/business/comic-detail/comic-detail-type";
import type { ImportChapterMode } from "@/routes/_authenticated/business/chapter/chapter-input";

type Args = {
  selectedChapterId: string | null;
  onImportChapter: ComicDetailModalProps["onImportChapter"];
  reloadCurrentPages: () => Promise<void>;
  reloadLoadedChapters: () => Promise<void>;
  onWorkflowRecordsChanged: () => void;
  showToast: (message: string, type: ToastType) => void;
};

export type PendingChapterImport = { file: File; chapterId: string };

export type ComicDetailImportState = {
  isImportingData: boolean;
  pendingImport: PendingChapterImport | null;
  handleImportFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  confirmImport: (mode: ImportChapterMode) => Promise<void>;
  cancelImport: () => void;
};

function detectImportFormat(file: File): "json" | "lp" | null {
  const name = file.name.toLowerCase();
  if (name.endsWith(".json")) return "json";
  if (name.endsWith(".txt")) return "lp";
  return null;
}

export function useComicDetailImport({
  selectedChapterId,
  onImportChapter,
  reloadCurrentPages,
  reloadLoadedChapters,
  onWorkflowRecordsChanged,
  showToast,
}: Args): ComicDetailImportState {
  const [isImportingData, setIsImportingData] = useState(false);
  const [pendingImport, setPendingImport] = useState<PendingChapterImport | null>(null);
  const importInFlightRef = useRef(false);

  const handleImportFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      const selectedFile = event.target.files?.[0];
      event.target.value = "";
      if (!selectedFile || !selectedChapterId || importInFlightRef.current) {
        return;
      }
      if (!detectImportFormat(selectedFile)) {
        showToast("仅支持 .json 或 .txt 文件", "error");
        return;
      }
      setPendingImport({ file: selectedFile, chapterId: selectedChapterId });
    },
    [selectedChapterId, showToast],
  );

  const cancelImport = useCallback((): void => {
    if (!importInFlightRef.current) setPendingImport(null);
  }, []);

  const confirmImport = useCallback(
    async (mode: ImportChapterMode): Promise<void> => {
      if (!pendingImport || importInFlightRef.current) return;
      const format = detectImportFormat(pendingImport.file);
      if (!format) return;
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
        onWorkflowRecordsChanged();
        showToast(
          `导入成功：${String(result.data.importedPageCount)} 页，` +
            `${String(result.data.importedUnitCount)} 单元`,
          "success",
        );
      } catch (error) {
        console.error("[ComicDetailModal] 导入章节数据异常:", error);
        showLocalCaughtError(error, showToast, "导入失败");
      } finally {
        importInFlightRef.current = false;
        setIsImportingData(false);
      }
    },
    [
      onImportChapter,
      onWorkflowRecordsChanged,
      reloadCurrentPages,
      reloadLoadedChapters,
      pendingImport,
      showToast,
    ],
  );

  return {
    isImportingData,
    pendingImport,
    handleImportFileChange,
    confirmImport,
    cancelImport,
  };
}
