import {
  type ArchiveProgress,
  compressTarXz,
  decompressTarXzToZip,
} from "@/shared/utility/compress";

export type ArchiveMode = "compress" | "extract";
export type ArchiveResult = {
  file: File;
  url: string;
  dispose: () => Promise<void>;
};

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${String(bytes)} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KiB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MiB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GiB`;
}

export function validateFiles(files: readonly File[], mode: ArchiveMode): string | null {
  if (files.length === 0) return "请先选择文件";
  if (mode === "extract" && (files.length !== 1 || !/\.tar\.xz$/iu.test(files[0]?.name ?? ""))) {
    return "请选择一个 .tar.xz 文件";
  }
  if (files.length > 1000) return "每次最多选择 1000 个文件";
  if (files.reduce((sum, file) => sum + file.size, 0) > 8 * 1024 ** 3) {
    return "文件总大小不能超过 8 GiB";
  }
  const names = new Set<string>();
  for (const file of files) {
    const name = file.name.normalize("NFC").toLowerCase();
    if (names.has(name)) return `存在同名文件：${file.name}，请重命名后再选择`;
    names.add(name);
  }
  return null;
}

export async function prepareArchive(
  files: readonly File[],
  mode: ArchiveMode,
  preset: number,
  signal: AbortSignal,
  onProgress: (progress: ArchiveProgress) => void,
): Promise<ArchiveResult> {
  const source = files[0];
  if (!source) throw new Error("请先选择文件");
  const error = validateFiles(files, mode);
  if (error) throw new Error(error);
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!navigator.storage?.getDirectory) {
    throw new Error("浏览器不支持本地临时文件，请使用新版 Chrome 或 Edge");
  }
  const root = await navigator.storage.getDirectory();
  signal.throwIfAborted();
  const name = `utility-${crypto.randomUUID()}`;
  const handle = await root.getFileHandle(name, { create: true });
  let url: string | undefined;
  async function dispose(): Promise<void> {
    if (url) URL.revokeObjectURL(url);
    await root.removeEntry(name);
  }
  try {
    signal.throwIfAborted();
    const output = await handle.createWritable();
    const options = { signal, onProgress, preset };
    const stream =
      mode === "compress"
        ? compressTarXz(
            files.map((blob) => ({ name: blob.name, blob })),
            options,
          )
        : decompressTarXzToZip(source, options);
    await stream.pipeTo(output, { signal });
    const file = await handle.getFile();
    signal.throwIfAborted();
    url = URL.createObjectURL(file);
    return { file, url, dispose };
  } catch (error) {
    await dispose();
    throw error;
  }
}
