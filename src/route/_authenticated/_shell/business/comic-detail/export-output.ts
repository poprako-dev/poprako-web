import type { ProgressUpdate } from "./comic-detail-export-types";

export interface ExportOutput {
  write: (path: string, data: Blob | string) => Promise<void>;
  finish: () => Promise<void>;
}

type DirectoryPickerWindow = Window & {
  showDirectoryPicker?: (options: {
    id: string;
    mode: "readwrite";
  }) => Promise<FileSystemDirectoryHandle>;
};

export async function selectExportDirectory(): Promise<FileSystemDirectoryHandle | null> {
  const pickerWindow = window as DirectoryPickerWindow;
  if (typeof pickerWindow.showDirectoryPicker !== "function") return null;
  return await pickerWindow.showDirectoryPicker({ id: "chapter-export", mode: "readwrite" });
}

async function createExportDirectory(
  parent: FileSystemDirectoryHandle,
  name: string,
  signal: AbortSignal,
): Promise<FileSystemDirectoryHandle> {
  for (let index = 1; ; index++) {
    signal.throwIfAborted();
    const candidate = index === 1 ? name : `${name} (${String(index)})`;
    try {
      await parent.getDirectoryHandle(candidate);
    } catch (error) {
      if (error instanceof DOMException && error.name === "TypeMismatchError") continue;
      if (!(error instanceof DOMException) || error.name !== "NotFoundError") throw error;
      signal.throwIfAborted();
      return await parent.getDirectoryHandle(candidate, { create: true });
    }
  }
}

async function writeDirectoryFile(
  directory: FileSystemDirectoryHandle,
  path: string,
  data: Blob | string,
  signal: AbortSignal,
): Promise<void> {
  const parts = path.split("/");
  const name = parts.pop();
  if (!name || [...parts, name].some((part) => !part || part === "." || part === ".."))
    throw new Error("无效的导出文件路径");
  let target = directory;
  for (const part of parts) {
    signal.throwIfAborted();
    target = await target.getDirectoryHandle(part, { create: true });
  }
  signal.throwIfAborted();
  const file = await target.getFileHandle(name, { create: true });
  signal.throwIfAborted();
  const writable = await file.createWritable();
  try {
    signal.throwIfAborted();
    await writable.write(data);
    signal.throwIfAborted();
    await writable.close();
  } catch (error) {
    await writable.abort().catch(() => undefined);
    throw error;
  }
}

async function createZipOutput(
  name: string,
  signal: AbortSignal,
  updateProgress: ProgressUpdate,
): Promise<ExportOutput> {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  return {
    write: (path, data) => {
      signal.throwIfAborted();
      zip.file(path, data);
      return Promise.resolve();
    },
    finish: async () => {
      signal.throwIfAborted();
      updateProgress("正在压缩文件", "正在生成 ZIP 文件，请稍候。", 88);
      const blob = await zip.generateAsync(
        { type: "blob", compression: "DEFLATE", streamFiles: true },
        (metadata) => {
          signal.throwIfAborted();
          updateProgress(
            "正在压缩文件",
            "正在生成 ZIP 文件，请稍候。",
            88 + metadata.percent * 0.1,
          );
        },
      );
      signal.throwIfAborted();
      saveZip(blob, name);
      updateProgress("下载完成", "文件已开始下载。", 100);
    },
  };
}

function saveZip(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${name}.zip`;
  document.body.append(link);
  try {
    link.click();
  } finally {
    link.remove();
    URL.revokeObjectURL(url);
  }
}

export async function createExportOutput(
  parent: FileSystemDirectoryHandle | null,
  name: string,
  signal: AbortSignal,
  updateProgress: ProgressUpdate,
): Promise<ExportOutput> {
  signal.throwIfAborted();
  if (!parent) return await createZipOutput(name, signal, updateProgress);
  const directory = await createExportDirectory(parent, name, signal);
  return {
    write: (path, data) => writeDirectoryFile(directory, path, data, signal),
    finish: () => {
      signal.throwIfAborted();
      updateProgress("下载完成", "文件已保存。", 100);
      return Promise.resolve();
    },
  };
}
