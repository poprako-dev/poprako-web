import { type Dispatch, type SetStateAction, useEffect, useRef, useState } from "react";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import type { ArchiveProgress } from "@/shared/utility/compress";
import {
  type ArchiveMode,
  type ArchiveResult,
  prepareArchive,
  validateFiles,
} from "@/route/_authenticated/_shell/(utility)/business/archive";

export function useArchiveTool(mode: ArchiveMode): {
  files: File[];
  name: string;
  setName: Dispatch<SetStateAction<string>>;
  preset: number;
  setPreset: (value: number) => void;
  phase: "error" | "ready" | "busy" | "done" | "cancelled";
  progress: ArchiveProgress;
  result: ArchiveResult | null;
  updateFiles: (next: File[]) => void;
  addFiles: (incoming: File[]) => void;
  start: () => Promise<void>;
  cancel: () => void;
  extension: string;
  outputName: string;
} {
  const [files, setFiles] = useState<File[]>([]);
  const [name, setName] = useState("嵌稿");
  const [preset, setPreset] = useState(3);
  const [phase, setPhase] = useState<"ready" | "busy" | "done" | "error" | "cancelled">("ready");
  const [progress, setProgress] = useState<ArchiveProgress>({
    processedBytes: 0,
    completedFiles: 0,
  });
  const [result, setResult] = useState<ArchiveResult | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const resultRef = useRef<ArchiveResult | null>(null);
  const showToast = useToastStore((s) => s.showToast);

  function disposeResult(): void {
    const previous = resultRef.current;
    resultRef.current = null;
    void previous?.dispose().catch((error: unknown) => {
      console.error("清理工具临时文件失败", error);
    });
  }

  useEffect(
    () => () => {
      controllerRef.current?.abort();
      disposeResult();
    },
    [],
  );

  function updateFiles(next: File[]): void {
    if (controllerRef.current) return;
    disposeResult();
    setResult(null);
    setFiles(next);
    setPhase("ready");
  }

  function addFiles(incoming: File[]): void {
    if (controllerRef.current || incoming.length === 0) return;
    const next = mode === "compress" ? [...files, ...incoming] : incoming;
    const error = validateFiles(next, mode);
    if (error) {
      showToast(error, "error");
      return;
    }
    updateFiles(next);
    if (mode === "extract" || files.length === 0) {
      setName((incoming[0]?.name ?? "嵌稿").replace(/(?:\.tar\.xz|\.[^.]+)$/iu, "") || "嵌稿");
    }
  }

  async function start(): Promise<void> {
    if (controllerRef.current) return;
    const error = validateFiles(files, mode);
    if (error) {
      showToast(error, "error");
      return;
    }
    const controller = new AbortController();
    controllerRef.current = controller;
    disposeResult();
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
      const text =
        error instanceof DOMException && error.name === "QuotaExceededError"
          ? "本地空间不足，请释放磁盘空间后重试"
          : "处理失败，请检查文件是否完整、浏览器是否支持，以及文件是否超过限制";
      setPhase("error");
      showToast(text, "error");
      console.error("压缩工具处理失败", error);
    } finally {
      controllerRef.current = null;
    }
  }

  function changePreset(value: number): void {
    updateFiles(files);
    setPreset(value);
  }

  function cancel(): void {
    controllerRef.current?.abort();
  }

  const extension = mode === "compress" ? ".tar.xz" : ".zip";
  const outputName = (name.trim().replaceAll(/[/\\:*?"<>|]/gu, "_") || "嵌稿") + extension;
  return {
    files,
    name,
    setName,
    preset,
    setPreset: changePreset,
    phase,
    progress,
    result,
    updateFiles,
    addFiles,
    start,
    cancel,
    extension,
    outputName,
  };
}
