import { useEffect, useRef, useState } from "react";
import { downloadArchive, type ArchiveExport, type ExportArchives } from "./archive-export";

type ExportState =
  | { phase: "idle" | "busy" | "empty" }
  | { phase: "error"; message: string }
  | { phase: "ready"; archive: ArchiveExport };

type ArchiveExportActions = {
  state: ExportState;
  start: (months: readonly string[] | undefined) => Promise<void>;
  cancel: () => void;
  reset: () => void;
};

export function useArchiveExport(onExport: ExportArchives): ArchiveExportActions {
  const [state, setState] = useState<ExportState>({ phase: "idle" });
  const controllerRef = useRef<AbortController | null>(null);
  useEffect(() => () => controllerRef.current?.abort(), []);

  function cancel(): void {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setState({ phase: "idle" });
  }

  async function start(months: readonly string[] | undefined): Promise<void> {
    if (controllerRef.current) return;
    const request = new AbortController();
    controllerRef.current = request;
    setState({ phase: "busy" });
    try {
      const result = await onExport(months, request.signal);
      if (request.signal.aborted) return;
      if (!result.success) {
        console.error("[ArchiveExport] 导出失败", result);
        const message = result.httpStatus === 403 ? "无权导出当前汉化组的归档" : "导出失败，请重试";
        setState({ phase: "error", message });
      } else if (result.data) {
        setState({ phase: "ready", archive: result.data });
        downloadArchive(result.data);
      } else {
        setState({ phase: "empty" });
      }
    } catch (error) {
      if (request.signal.aborted) return;
      console.error("[ArchiveExport] 导出失败", error);
      setState({ phase: "error", message: "导出失败，请重试" });
    } finally {
      if (controllerRef.current === request) controllerRef.current = null;
    }
  }

  return {
    state,
    start,
    cancel,
    reset: () => {
      setState({ phase: "idle" });
    },
  };
}
