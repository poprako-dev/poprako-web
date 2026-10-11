import { type Dispatch, type SetStateAction, useEffect, useRef, useState } from "react";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import type { ArchiveResult } from "@/route/_authenticated/_shell/utilities/business/archive";
import type { BoundedImage } from "@/route/_authenticated/_shell/utilities/business/bounded-images";
import {
  createBoundedActions,
  disposeBoundedResult,
  isBoundedInputValid,
} from "@/route/_authenticated/_shell/utilities/business/bounded-compression-actions";

type BoundedCompressionState = {
  items: BoundedImage[];
  setItems: Dispatch<SetStateAction<BoundedImage[]>>;
  body: string;
  setBody: Dispatch<SetStateAction<string>>;
  cover: string;
  setCover: Dispatch<SetStateAction<string>>;
  busy: boolean;
  setBusy: Dispatch<SetStateAction<boolean>>;
  completed: number;
  setCompleted: Dispatch<SetStateAction<number>>;
  status: string;
  setStatus: Dispatch<SetStateAction<string>>;
  result: ArchiveResult | null;
  setResult: Dispatch<SetStateAction<ArchiveResult | null>>;
  controllerRef: { current: AbortController | null };
  resultRef: { current: ArchiveResult | null };
  showToast: ReturnType<typeof useToastStore.getState>["showToast"];
};

function useBoundedCompressionState(): BoundedCompressionState {
  const [items, setItems] = useState<BoundedImage[]>([]);
  const [body, setBody] = useState("1024");
  const [cover, setCover] = useState("512");
  const [busy, setBusy] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [status, setStatus] = useState("");
  const [result, setResult] = useState<ArchiveResult | null>(null);
  const resultRef = useRef<ArchiveResult | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const showToast = useToastStore((state) => state.showToast);
  useEffect(
    () => () => {
      controllerRef.current?.abort();
      disposeBoundedResult(resultRef);
    },
    [],
  );
  return {
    items,
    setItems,
    body,
    setBody,
    cover,
    setCover,
    busy,
    setBusy,
    completed,
    setCompleted,
    status,
    setStatus,
    result,
    setResult,
    controllerRef,
    resultRef,
    showToast,
  };
}

type BoundedCompressionApi = {
  items: BoundedImage[];
  body: string;
  cover: string;
  busy: boolean;
  completed: number;
  status: string;
  result: ArchiveResult | null;
  isValid: boolean;
  updateItems: (next: BoundedImage[]) => void;
  addFiles: (files: File[]) => void;
  changeDefault: (kind: "body" | "cover", value: string) => void;
  start: () => Promise<void>;
  cancel: () => void;
};

export function useBoundedCompression(): BoundedCompressionApi {
  const state = useBoundedCompressionState();
  const actions = createBoundedActions(state);
  const isValid = isBoundedInputValid(state.items, state.body, state.cover);

  return {
    items: state.items,
    body: state.body,
    cover: state.cover,
    busy: state.busy,
    completed: state.completed,
    status: state.status,
    result: state.result,
    isValid,
    updateItems: actions.updateItems,
    addFiles: actions.addFiles,
    changeDefault: actions.changeDefault,
    start: actions.start,
    cancel: actions.cancel,
  };
}
