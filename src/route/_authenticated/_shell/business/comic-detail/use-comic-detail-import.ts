import { useCallback, useRef, useState } from "react";
import { showLocalApiFailure, showLocalCaughtError } from "@/route/business/request-error";
import type { ToastType } from "@/shared/component/notification-toast/notification-toast-type";
import type { DetailContract } from "@/route/_authenticated/_shell/business/comic-detail/comic-detail-type";
import type { ImportChapterMode } from "@/route/_authenticated/business/chapter/chapter-input";

type Args = {
  selectedChapterId: string | null;
  onImportChapter: DetailContract["onImportChapter"];
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

function reportImportFailure(error: unknown, showToast: Args["showToast"]): void {
  console.error("[ComicDetailModal] 导入章节数据异常:", error);
  showLocalCaughtError(error, showToast, "导入失败");
}

type ImportRequest = {
  pendingImport: PendingChapterImport;
  mode: ImportChapterMode;
  onImportChapter: Args["onImportChapter"];
  reloadCurrentPages: Args["reloadCurrentPages"];
  reloadLoadedChapters: Args["reloadLoadedChapters"];
  onWorkflowRecordsChanged: Args["onWorkflowRecordsChanged"];
  showToast: Args["showToast"];
  setPendingImport: (value: PendingChapterImport | null) => void;
};

async function importChapterData(request: ImportRequest): Promise<void> {
  const { pendingImport, mode, onImportChapter, showToast, setPendingImport } = request;
  const format = detectImportFormat(pendingImport.file);
  if (!format) return;

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
  await Promise.all([request.reloadCurrentPages(), request.reloadLoadedChapters()]);
  request.onWorkflowRecordsChanged();
  showToast(
    `导入成功：${String(result.data.importedPageCount)} 页，` +
      `${String(result.data.importedUnitCount)} 单元`,
    "success",
  );
}

function useImportFileChange(
  selectedChapterId: string | null,
  importInFlightRef: { current: boolean },
  setPendingImport: (value: PendingChapterImport | null) => void,
  showToast: Args["showToast"],
): ComicDetailImportState["handleImportFileChange"] {
  return useCallback(
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
    [selectedChapterId, importInFlightRef, setPendingImport, showToast],
  );
}

function useImportConfirmation(
  request: Omit<ImportRequest, "pendingImport" | "mode" | "setPendingImport">,
  pendingImport: PendingChapterImport | null,
  setPendingImport: (value: PendingChapterImport | null) => void,
  importInFlightRef: { current: boolean },
): Pick<ComicDetailImportState, "isImportingData" | "confirmImport" | "cancelImport"> {
  const [isImportingData, setIsImportingData] = useState(false);
  const confirmImport = useCallback(
    async (mode: ImportChapterMode): Promise<void> => {
      if (!pendingImport || importInFlightRef.current) return;
      importInFlightRef.current = true;
      setIsImportingData(true);
      try {
        await importChapterData({
          pendingImport,
          mode,
          ...request,
          setPendingImport,
        });
      } catch (error) {
        reportImportFailure(error, request.showToast);
      } finally {
        importInFlightRef.current = false;
        setIsImportingData(false);
      }
    },
    [pendingImport, request, setPendingImport, importInFlightRef],
  );
  const cancelImport = useCallback((): void => {
    if (!importInFlightRef.current) setPendingImport(null);
  }, [setPendingImport, importInFlightRef]);

  return { isImportingData, confirmImport, cancelImport };
}

export function useComicDetailImport(args: Args): ComicDetailImportState {
  const [pendingImport, setPendingImport] = useState<PendingChapterImport | null>(null);
  const importInFlightRef = useRef(false);
  const handleImportFileChange = useImportFileChange(
    args.selectedChapterId,
    importInFlightRef,
    setPendingImport,
    args.showToast,
  );
  const confirmation = useImportConfirmation(
    args,
    pendingImport,
    setPendingImport,
    importInFlightRef,
  );

  return {
    ...confirmation,
    pendingImport,
    handleImportFileChange,
  };
}
