import imageCompression from "browser-image-compression";
import compressionWorkerUrl from "browser-image-compression/dist/browser-image-compression.js?url";
import { ZipWriter } from "@zip.js/zip.js";
import type { ArchiveResult } from "@/route/_authenticated/_shell/utilities/business/archive";
import {
  imageLimit,
  limitBytes,
  sortImages,
  validateImages,
  webpName,
} from "@/route/_authenticated/_shell/utilities/business/bounded-images";
import type { BoundedImage } from "@/route/_authenticated/_shell/utilities/business/bounded-images";

async function disposeTemporaryArchive(
  root: FileSystemDirectoryHandle,
  name: string,
  url: string | undefined,
): Promise<void> {
  if (url) URL.revokeObjectURL(url);
  await root.removeEntry(name);
}

function validateAndCalculateLimits(
  items: readonly BoundedImage[],
  body: string,
  cover: string,
): { sorted: BoundedImage[]; limits: (number | null)[] } {
  const sorted = sortImages(items);
  const error = validateImages(sorted);
  if (error) throw new Error(error);
  const limits = sorted.map((item, index) => limitBytes(imageLimit(item, index, body, cover)));
  if (limits.includes(null)) throw new Error("压缩上限必须至少为 1 KiB");
  return { sorted, limits };
}

export async function compressImage(
  file: File,
  maxBytes: number,
  signal: AbortSignal,
): Promise<File> {
  signal.throwIfAborted();
  const output = await imageCompression(file, {
    maxSizeMB: maxBytes / 1024 ** 2,
    fileType: "image/webp",
    maxIteration: 30,
    useWebWorker: true,
    libURL: compressionWorkerUrl,
    signal,
  });
  signal.throwIfAborted();
  if (output.type !== "image/webp") {
    throw new Error(`${file.name}：浏览器无法输出 WebP，请使用新版 Chrome 或 Edge`);
  }
  if (output.size === 0 || output.size > maxBytes) {
    throw new Error(`${file.name}：无法压缩到指定上限，请提高上限后重试`);
  }
  return output;
}

export async function prepareBoundedArchive(
  items: readonly BoundedImage[],
  body: string,
  cover: string,
  signal: AbortSignal,
  onProgress: (completed: number) => void,
): Promise<ArchiveResult> {
  const { sorted, limits } = validateAndCalculateLimits(items, body, cover);
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!navigator.storage?.getDirectory) {
    throw new Error("浏览器不支持本地临时文件，请使用新版 Chrome 或 Edge");
  }
  signal.throwIfAborted();
  const root = await navigator.storage.getDirectory();
  const name = `bounded-${crypto.randomUUID()}`;
  const handle = await root.getFileHandle(name, { create: true });
  let url: string | undefined;
  let output: FileSystemWritableFileStream | undefined;
  const dispose = (): Promise<void> => disposeTemporaryArchive(root, name, url);
  try {
    signal.throwIfAborted();
    output = await handle.createWritable();
    const zip = new ZipWriter(output, {
      level: 0,
      bufferedWrite: false,
      useWebWorkers: false,
    });
    for (const [index, item] of sorted.entries()) {
      const limit = limits[index];
      if (!limit) throw new Error("无效的压缩上限");
      const compressed = await compressImage(item.file, limit, signal);
      await zip.add(webpName(item.file.name), compressed.stream(), { signal });
      onProgress(index + 1);
    }
    signal.throwIfAborted();
    await zip.close();
    const file = await handle.getFile();
    signal.throwIfAborted();
    url = URL.createObjectURL(file);
    return { file, url, dispose };
  } catch (error) {
    try {
      await output?.abort();
    } catch {
      /* The ZIP stream may already be closed. */
    }
    await dispose();
    throw error;
  }
}
