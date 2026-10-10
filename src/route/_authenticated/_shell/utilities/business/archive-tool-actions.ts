import type { Dispatch, SetStateAction } from "react";
import {
  prepareArchive,
  validateFiles,
} from "@/route/_authenticated/_shell/utilities/business/archive";
import type {
  ArchiveMode,
  ArchiveResult,
} from "@/route/_authenticated/_shell/utilities/business/archive";
import type { ArchiveProgress } from "@/shared/utility/compress";

type ArchiveResultRef = { current: ArchiveResult | null };
type ControllerRef = { current: AbortController | null };
type ShowToast = (message: string, type: "success" | "error") => void;

export function disposeArchiveResult(resultRef: ArchiveResultRef): void {
  const previous = resultRef.current;
  resultRef.current = null;
  void previous?.dispose().catch((error: unknown) => {
    console.error("清理工具临时文件失败", error);
  });
}

export function updateArchiveFiles(
  next: File[],
  controllerRef: ControllerRef,
  resultRef: ArchiveResultRef,
  setResult: Dispatch<SetStateAction<ArchiveResult | null>>,
  setFiles: Dispatch<SetStateAction<File[]>>,
  setPhase: Dispatch<SetStateAction<"error" | "ready" | "busy" | "done" | "cancelled">>,
): void {
  if (controllerRef.current) {
    return;
  }
  disposeArchiveResult(resultRef);
  setResult(null);
  setFiles(next);
  setPhase("ready");
}

export function addArchiveFiles(
  incoming: File[],
  files: File[],
  mode: ArchiveMode,
  controllerRef: ControllerRef,
  resultRef: ArchiveResultRef,
  setResult: Dispatch<SetStateAction<ArchiveResult | null>>,
  setFiles: Dispatch<SetStateAction<File[]>>,
  setPhase: Dispatch<SetStateAction<"error" | "ready" | "busy" | "done" | "cancelled">>,
  setName: Dispatch<SetStateAction<string>>,
  showToast: ShowToast,
): void {
  if (controllerRef.current || incoming.length === 0) {
    return;
  }
  const next = mode === "compress" ? [...files, ...incoming] : incoming;
  const error = validateFiles(next, mode);
  if (error) {
    showToast(error, "error");
    return;
  }
  updateArchiveFiles(next, controllerRef, resultRef, setResult, setFiles, setPhase);
  if (mode === "extract" || files.length === 0) {
    const firstName = incoming[0]?.name ?? "嵌稿";
    setName(firstName.replace(/(?:\.tar\.xz|\.[^.]+)$/iu, "") || "嵌稿");
  }
}

export async function startArchive(
  files: File[],
  mode: ArchiveMode,
  preset: number,
  controllerRef: ControllerRef,
  resultRef: ArchiveResultRef,
  setResult: Dispatch<SetStateAction<ArchiveResult | null>>,
  setPhase: Dispatch<SetStateAction<"error" | "ready" | "busy" | "done" | "cancelled">>,
  setProgress: Dispatch<SetStateAction<ArchiveProgress>>,
  showToast: ShowToast,
): Promise<void> {
  if (controllerRef.current) {
    return;
  }
  const validationError = validateFiles(files, mode);
  if (validationError) {
    showToast(validationError, "error");
    return;
  }
  const controller = new AbortController();
  controllerRef.current = controller;
  disposeArchiveResult(resultRef);
  setResult(null);
  setPhase("busy");
  setProgress({ processedBytes: 0, completedFiles: 0 });
  try {
    const archive = await prepareArchive(files, mode, preset, controller.signal, setProgress);
    if (controller.signal.aborted) {
      await archive.dispose();
      controller.signal.throwIfAborted();
    }
    resultRef.current = archive;
    setResult(archive);
    setPhase("done");
  } catch (error) {
    if (controller.signal.aborted) {
      setPhase("cancelled");
      return;
    }
    reportArchiveFailure(error, setPhase, showToast);
  } finally {
    controllerRef.current = null;
  }
}

type ArchiveActionContext = {
  mode: ArchiveMode;
  files: File[];
  preset: number;
  controllerRef: ControllerRef;
  resultRef: ArchiveResultRef;
  setResult: Dispatch<SetStateAction<ArchiveResult | null>>;
  setFiles: Dispatch<SetStateAction<File[]>>;
  setName: Dispatch<SetStateAction<string>>;
  setPreset: Dispatch<SetStateAction<number>>;
  setPhase: Dispatch<SetStateAction<"error" | "ready" | "busy" | "done" | "cancelled">>;
  setProgress: Dispatch<SetStateAction<ArchiveProgress>>;
  showToast: ShowToast;
};

interface ArchiveActions {
  updateFiles: (next: File[]) => void;
  addFiles: (incoming: File[]) => void;
  start: () => Promise<void>;
  changePreset: (value: number) => void;
  cancel: () => void;
}

export function createArchiveActions(context: ArchiveActionContext): ArchiveActions {
  const updateFiles = (next: File[]): void => {
    updateArchiveFiles(
      next,
      context.controllerRef,
      context.resultRef,
      context.setResult,
      context.setFiles,
      context.setPhase,
    );
  };
  const addFiles = (incoming: File[]): void => {
    addArchiveFiles(
      incoming,
      context.files,
      context.mode,
      context.controllerRef,
      context.resultRef,
      context.setResult,
      context.setFiles,
      context.setPhase,
      context.setName,
      context.showToast,
    );
  };
  const start = (): Promise<void> =>
    startArchive(
      context.files,
      context.mode,
      context.preset,
      context.controllerRef,
      context.resultRef,
      context.setResult,
      context.setPhase,
      context.setProgress,
      context.showToast,
    );
  const changePreset = (value: number): void => {
    updateFiles(context.files);
    context.setPreset(value);
  };
  const cancel = (): void => {
    context.controllerRef.current?.abort();
  };
  return { updateFiles, addFiles, start, changePreset, cancel };
}

function reportArchiveFailure(
  error: unknown,
  setPhase: Dispatch<SetStateAction<"error" | "ready" | "busy" | "done" | "cancelled">>,
  showToast: ShowToast,
): void {
  const message =
    error instanceof DOMException && error.name === "QuotaExceededError"
      ? "本地空间不足，请释放磁盘空间后重试"
      : "处理失败，请检查文件是否完整、浏览器是否支持，以及文件是否超过限制";
  setPhase("error");
  showToast(message, "error");
  console.error("压缩工具处理失败", error);
}
