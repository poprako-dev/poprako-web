import { sha256 } from "@noble/hashes/sha2.js";
import { type ArchiveProgress, compressTarXz } from "@/shared/utility/compress";
import {
  type ChapterInfo,
  publishWorkflowStatus,
} from "@/routes/_authenticated/business/chapter/chapter";
import { matchesAssignmentRole } from "@/routes/business/identity/role";
import type { AssignmentInfo } from "@/routes/_authenticated/business/assignment/assignment";

export function canUploadArtwork(
  chapter: ChapterInfo | undefined,
  assignment: AssignmentInfo | undefined,
): boolean {
  return (
    chapter !== undefined &&
    assignment?.chapterId === chapter.id &&
    publishWorkflowStatus(chapter) !== "completed" &&
    matchesAssignmentRole(assignment, "typesetter")
  );
}

export function validateArtworkFiles(files: readonly File[]): void {
  if (files.length === 0) throw new Error("请先选择嵌稿文件");
  if (files.length > 1000) throw new Error("每次最多选择 1000 个文件");
  if (files.reduce((sum, file) => sum + file.size, 0) > 8 * 1024 ** 3) {
    throw new Error("原始文件总大小不能超过 8 GiB");
  }
  const names = new Set<string>();
  for (const file of files) {
    const name = file.name.normalize("NFC").toLowerCase();
    if (names.has(name)) {
      throw new Error(`存在同名文件：${file.name}，请重命名后再选择`);
    }
    names.add(name);
  }
}

export type PreparedArtwork = {
  file: File;
  hash: string;
  dispose: () => Promise<void>;
};

// Stage on disk: neither PSD inputs nor the complete archive are buffered in JS memory.
export async function prepareArtwork(
  files: readonly File[],
  signal: AbortSignal,
  onProgress: (progress: ArchiveProgress) => void,
): Promise<PreparedArtwork> {
  validateArtworkFiles(files);
  // Older browsers may omit OPFS despite the DOM type declarations.
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!navigator.storage?.getDirectory) {
    throw new Error("当前浏览器不支持本地临时文件，请使用新版 Chrome 或 Edge 上传嵌稿");
  }
  const root = await navigator.storage.getDirectory();
  const name = `artwork-${crypto.randomUUID()}.tar.xz`;
  const handle = await root.getFileHandle(name, { create: true });
  const dispose = async (): Promise<void> => {
    await root.removeEntry(name);
  };
  try {
    signal.throwIfAborted();
    const output = await handle.createWritable();
    const hash = sha256.create();
    await compressTarXz(
      files.map((blob) => ({ name: blob.name, blob })),
      { signal, onProgress },
    )
      .pipeThrough(
        new TransformStream<Uint8Array, Uint8Array>({
          transform(chunk, controller): void {
            hash.update(chunk);
            controller.enqueue(chunk);
          },
        }),
      )
      .pipeTo(output, { signal });
    const file = await handle.getFile();
    const digest = btoa(String.fromCodePoint(...hash.digest()));
    return { file, hash: digest, dispose };
  } catch (error) {
    await dispose();
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      throw new Error("本地临时空间不足，请释放磁盘空间后重试", {
        cause: error,
      });
    }
    throw error;
  }
}
