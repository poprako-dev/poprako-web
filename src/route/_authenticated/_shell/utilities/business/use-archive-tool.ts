import { type Dispatch, type SetStateAction, useEffect, useRef, useState } from "react";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import type { ArchiveProgress } from "@/shared/utility/compress";
import type {
  ArchiveMode,
  ArchiveResult,
} from "@/route/_authenticated/_shell/utilities/business/archive";
import {
  createArchiveActions,
  disposeArchiveResult,
} from "@/route/_authenticated/_shell/utilities/business/archive-tool-actions";

type Phase = "error" | "ready" | "busy" | "done" | "cancelled";
type ArchiveToolState = {
  files: File[];
  setFiles: Dispatch<SetStateAction<File[]>>;
  name: string;
  setName: Dispatch<SetStateAction<string>>;
  preset: number;
  setPreset: Dispatch<SetStateAction<number>>;
  phase: Phase;
  setPhase: Dispatch<SetStateAction<Phase>>;
  progress: ArchiveProgress;
  setProgress: Dispatch<SetStateAction<ArchiveProgress>>;
  result: ArchiveResult | null;
  setResult: Dispatch<SetStateAction<ArchiveResult | null>>;
  controllerRef: { current: AbortController | null };
  resultRef: { current: ArchiveResult | null };
  showToast: ReturnType<typeof useToastStore.getState>["showToast"];
};

function useArchiveToolState(): ArchiveToolState {
  const [files, setFiles] = useState<File[]>([]);
  const [name, setName] = useState("嵌稿");
  const [preset, setPreset] = useState(3);
  const [phase, setPhase] = useState<Phase>("ready");
  const [progress, setProgress] = useState<ArchiveProgress>({
    processedBytes: 0,
    completedFiles: 0,
  });
  const [result, setResult] = useState<ArchiveResult | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const resultRef = useRef<ArchiveResult | null>(null);
  const showToast = useToastStore((s) => s.showToast);
  useEffect(
    () => () => {
      controllerRef.current?.abort();
      disposeArchiveResult(resultRef);
    },
    [],
  );
  return {
    files,
    setFiles,
    name,
    setName,
    preset,
    setPreset,
    phase,
    setPhase,
    progress,
    setProgress,
    result,
    setResult,
    controllerRef,
    resultRef,
    showToast,
  };
}

type ArchiveToolApi = {
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
};

export function useArchiveTool(mode: ArchiveMode): ArchiveToolApi {
  const state = useArchiveToolState();
  const actions = createArchiveActions({
    mode,
    files: state.files,
    preset: state.preset,
    controllerRef: state.controllerRef,
    resultRef: state.resultRef,
    setResult: state.setResult,
    setFiles: state.setFiles,
    setName: state.setName,
    setPreset: state.setPreset,
    setPhase: state.setPhase,
    setProgress: state.setProgress,
    showToast: state.showToast,
  });
  const extension = mode === "compress" ? ".tar.xz" : ".zip";
  const outputName = (state.name.trim().replaceAll(/[/\\:*?"<>|]/gu, "_") || "嵌稿") + extension;
  return {
    files: state.files,
    name: state.name,
    setName: state.setName,
    preset: state.preset,
    setPreset: actions.changePreset,
    phase: state.phase,
    progress: state.progress,
    result: state.result,
    updateFiles: actions.updateFiles,
    addFiles: actions.addFiles,
    start: actions.start,
    cancel: actions.cancel,
    extension,
    outputName,
  };
}
