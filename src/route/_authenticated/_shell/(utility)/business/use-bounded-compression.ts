import { useEffect, useRef, useState } from "react";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import type { ArchiveResult } from "@/route/_authenticated/_shell/(utility)/business/archive";
import { prepareBoundedArchive } from "@/route/_authenticated/_shell/(utility)/business/bounded-compression";
import {
  imageLimit,
  limitBytes,
  sortImages,
  validateImages,
} from "@/route/_authenticated/_shell/(utility)/business/bounded-images";
import type { BoundedImage } from "@/route/_authenticated/_shell/(utility)/business/bounded-images";

export function useBoundedCompression(): {
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
} {
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

  function disposeResult(): void {
    const previous = resultRef.current;
    resultRef.current = null;
    void previous?.dispose().catch((error: unknown) => {
      console.error("清理定界压缩临时文件失败", error);
    });
  }

  useEffect(
    () => () => {
      controllerRef.current?.abort();
      disposeResult();
    },
    [],
  );

  function invalidate(): void {
    disposeResult();
    setResult(null);
    setStatus("");
    setCompleted(0);
  }

  function updateItems(next: BoundedImage[]): void {
    if (controllerRef.current) return;
    invalidate();
    setItems(sortImages(next));
  }

  function addFiles(files: File[]): void {
    if (controllerRef.current || files.length === 0) return;
    const next = [
      ...items,
      ...files.map((file) => ({
        id: crypto.randomUUID(),
        file,
        limitKiB: null,
      })),
    ];
    const error = validateImages(next);
    if (error) {
      showToast(error, "error");
      return;
    }
    updateItems(next);
  }

  function changeDefault(kind: "body" | "cover", value: string): void {
    if (controllerRef.current) return;
    invalidate();
    if (kind === "body") setBody(value);
    else setCover(value);
  }

  const isValid =
    items.length > 0 &&
    limitBytes(body) !== null &&
    limitBytes(cover) !== null &&
    items.every((item, index) => limitBytes(imageLimit(item, index, body, cover)) !== null);

  async function start(): Promise<void> {
    if (!isValid || controllerRef.current) return;
    const controller = new AbortController();
    controllerRef.current = controller;
    invalidate();
    setBusy(true);
    try {
      const archive = await prepareBoundedArchive(
        items,
        body,
        cover,
        controller.signal,
        setCompleted,
      );
      if (controller.signal.aborted) {
        await archive.dispose();
        controller.signal.throwIfAborted();
      }
      resultRef.current = archive;
      setResult(archive);
      setStatus("压缩完成，所有图片均已转换为 WebP 并符合上限");
    } catch (error) {
      if (controller.signal.aborted) {
        setStatus("已取消，可重新开始");
        return;
      }
      const message = error instanceof Error ? error.message : "定界压缩失败，请重试";
      setStatus(message);
      showToast(message, "error");
      console.error("定界压缩失败", error);
    } finally {
      controllerRef.current = null;
      setBusy(false);
    }
  }

  function cancel(): void {
    controllerRef.current?.abort();
  }

  return {
    items,
    body,
    cover,
    busy,
    completed,
    status,
    result,
    isValid,
    updateItems,
    addFiles,
    changeDefault,
    start,
    cancel,
  };
}
