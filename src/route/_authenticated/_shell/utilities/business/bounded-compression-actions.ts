import type { Dispatch, SetStateAction } from "react";
import type { ArchiveResult } from "@/route/_authenticated/_shell/utilities/business/archive";
import { prepareBoundedArchive } from "@/route/_authenticated/_shell/utilities/business/bounded-compression";
import {
  imageLimit,
  limitBytes,
  sortImages,
  validateImages,
} from "@/route/_authenticated/_shell/utilities/business/bounded-images";
import type { BoundedImage } from "@/route/_authenticated/_shell/utilities/business/bounded-images";

type ControllerRef = { current: AbortController | null };
type ResultRef = { current: ArchiveResult | null };
type Toast = (message: string, type: "success" | "error") => void;
type Context = {
  items: BoundedImage[];
  body: string;
  cover: string;
  controllerRef: ControllerRef;
  resultRef: ResultRef;
  setItems: Dispatch<SetStateAction<BoundedImage[]>>;
  setBody: Dispatch<SetStateAction<string>>;
  setCover: Dispatch<SetStateAction<string>>;
  setBusy: Dispatch<SetStateAction<boolean>>;
  setCompleted: Dispatch<SetStateAction<number>>;
  setStatus: Dispatch<SetStateAction<string>>;
  setResult: Dispatch<SetStateAction<ArchiveResult | null>>;
  showToast: Toast;
};

export function disposeBoundedResult(resultRef: ResultRef): void {
  const previous = resultRef.current;
  resultRef.current = null;
  void previous?.dispose().catch((error: unknown) => {
    console.error("清理定界压缩临时文件失败", error);
  });
}

export function invalidateBoundedResult(context: Context): void {
  disposeBoundedResult(context.resultRef);
  context.setResult(null);
  context.setStatus("");
  context.setCompleted(0);
}

export function updateBoundedItems(context: Context, next: BoundedImage[]): void {
  if (context.controllerRef.current) {
    return;
  }
  invalidateBoundedResult(context);
  context.setItems(sortImages(next));
}

export function addBoundedFiles(context: Context, files: File[]): void {
  if (context.controllerRef.current || files.length === 0) {
    return;
  }
  const next = [
    ...context.items,
    ...files.map((file) => ({ id: crypto.randomUUID(), file, limitKiB: null })),
  ];
  const error = validateImages(next);
  if (error) {
    context.showToast(error, "error");
    return;
  }
  updateBoundedItems(context, next);
}

export function changeBoundedDefault(
  context: Context,
  kind: "body" | "cover",
  value: string,
): void {
  if (context.controllerRef.current) {
    return;
  }
  invalidateBoundedResult(context);
  if (kind === "body") {
    context.setBody(value);
  } else {
    context.setCover(value);
  }
}

export async function startBoundedCompression(context: Context): Promise<void> {
  if (
    !isBoundedInputValid(context.items, context.body, context.cover) ||
    context.controllerRef.current
  ) {
    return;
  }
  const controller = new AbortController();
  context.controllerRef.current = controller;
  invalidateBoundedResult(context);
  context.setBusy(true);
  try {
    const archive = await prepareBoundedArchive(
      context.items,
      context.body,
      context.cover,
      controller.signal,
      context.setCompleted,
    );
    if (controller.signal.aborted) {
      await archive.dispose();
      controller.signal.throwIfAborted();
    }
    context.resultRef.current = archive;
    context.setResult(archive);
    context.setStatus("压缩完成，所有图片均已转换为 WebP 并符合上限");
  } catch (error) {
    if (controller.signal.aborted) {
      context.setStatus("已取消，可重新开始");
      return;
    }
    const message = error instanceof Error ? error.message : "定界压缩失败，请重试";
    context.setStatus(message);
    context.showToast(message, "error");
    console.error("定界压缩失败", error);
  } finally {
    context.controllerRef.current = null;
    context.setBusy(false);
  }
}

export function isBoundedInputValid(items: BoundedImage[], body: string, cover: string): boolean {
  return (
    items.length > 0 &&
    limitBytes(body) !== null &&
    limitBytes(cover) !== null &&
    items.every((item, index) => limitBytes(imageLimit(item, index, body, cover)) !== null)
  );
}

interface BoundedActions {
  updateItems: (next: BoundedImage[]) => void;
  addFiles: (files: File[]) => void;
  changeDefault: (kind: "body" | "cover", value: string) => void;
  start: () => Promise<void>;
  cancel: () => void;
}

export function createBoundedActions(context: Context): BoundedActions {
  const updateItems = (next: BoundedImage[]): void => {
    updateBoundedItems(context, next);
  };
  const addFiles = (files: File[]): void => {
    addBoundedFiles(context, files);
  };
  const changeDefault = (kind: "body" | "cover", value: string): void => {
    changeBoundedDefault(context, kind, value);
  };
  const start = (): Promise<void> => startBoundedCompression(context);
  const cancel = (): void => {
    context.controllerRef.current?.abort();
  };
  return { updateItems, addFiles, changeDefault, start, cancel };
}
