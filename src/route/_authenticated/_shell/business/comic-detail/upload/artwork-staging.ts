import { prepareComposite } from "@/shared/utility/image/composite";
import type { ArtworkPageTask, ArtworkTask } from "./artwork-batch-types";
export function createArtworkStaging(
  pages: ArtworkPageTask[],
  patch: (id: string, change: Partial<ArtworkTask>) => void,
): { prepare: (signal: AbortSignal) => Promise<void>; dispose: () => Promise<void> } {
  let directory: FileSystemDirectoryHandle | null = null;
  const directoryName = "artwork-previews-" + crypto.randomUUID();
  async function prepare(signal: AbortSignal): Promise<void> {
    if (!("storage" in navigator) || !("getDirectory" in navigator.storage))
      throw new Error("当前浏览器不支持本地临时文件，请使用新版 Chrome 或 Edge 上传嵌稿");
    const root = await navigator.storage.getDirectory();
    directory ??= await root.getDirectoryHandle(directoryName, { create: true });
    for (const page of pages) {
      signal.throwIfAborted();
      if (page.prepared) continue;
      try {
        const result = await prepareComposite(page.input, signal, (phase) => {
          patch(page.id, { phase, error: null });
        });
        signal.throwIfAborted();
        const handle = await directory.getFileHandle(page.id + ".webp", { create: true });
        const writable = await handle.createWritable();
        await result.blob.stream().pipeTo(writable, { signal });
        page.prepared = { file: await handle.getFile(), hash: result.hash, name: page.input.name };
        patch(page.id, { phase: "prepared" });
      } catch (error) {
        patch(page.id, {
          phase: signal.aborted ? "cancelled" : "failed",
          error: error instanceof Error ? error.message : String(error),
        });
        signal.throwIfAborted();
      }
    }
    if (pages.some((page) => !page.prepared))
      throw new Error("部分 PSD 无法生成预览，请检查失败文件并重试；已准备的预览会保留。");
  }
  return {
    prepare,
    async dispose() {
      if (directory) {
        const root = await navigator.storage.getDirectory();
        await root.removeEntry(directoryName, { recursive: true });
        directory = null;
      }
    },
  };
}
