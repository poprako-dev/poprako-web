import { BlobReader, ZipReader } from "@zip.js/zip.js";
import type { FileEntry } from "@zip.js/zip.js";
import type { ApiClient } from "@/api/client";
import { exportArtwork } from "@/api/chapter/artwork-api";
import { downloadPresignedStream } from "@/api/presigned-download";
import { toApiRequestError } from "@/route/business/request-error";
import { decompressTarXzToZip } from "@/shared/utility/compress";
import { openPsdPage } from "./open-psd-page";
import { orderArtworkPages } from "./artwork-page-order";
import type { LoadReviewPage, ReviewPage } from "./review-page";

type Archive = {
  directory: FileSystemDirectoryHandle;
  entries: FileEntry[];
  reader: ZipReader<Blob>;
};
export type ArtworkPageSource = {
  loadPage: LoadReviewPage;
  dispose: () => Promise<void>;
};

// Stage the archive and current PSD on disk. Only the current page is decoded.
export function createArtworkPageSource(
  client: ApiClient,
  chapterId: string,
  pageIds: readonly string[],
): ArtworkPageSource {
  const lifetime = new AbortController();
  let prepared: Promise<Archive> | null = null;
  let cleanup: (() => Promise<void>) | null = null;
  let disposed = false;
  const pending = new Set<Promise<ReviewPage>>();
  const pages = new Set<ReviewPage>();

  async function prepare(): Promise<Archive> {
    const signal = lifetime.signal;
    const result = await exportArtwork(client, chapterId, signal);
    signal.throwIfAborted();
    if (!result.success) throw toApiRequestError(result);
    if (result.data.ext !== "xz") throw new Error("当前嵌稿包格式不支持预览");
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- OPFS may be absent in older browsers.
    if (!navigator.storage?.getDirectory)
      throw new Error("当前浏览器不支持成稿临时文件，请使用新版 Chrome 或 Edge");
    const root = await navigator.storage.getDirectory();
    const name = `review-artwork-${crypto.randomUUID()}`;
    const directory = await root.getDirectoryHandle(name, { create: true });
    let reader: ZipReader<Blob> | null = null;
    cleanup = async () => {
      try {
        await reader?.close();
      } finally {
        await root.removeEntry(name, { recursive: true });
      }
    };
    try {
      signal.throwIfAborted();
      const stream = await downloadPresignedStream(result.data.downloadUrl, signal);
      const handle = await directory.getFileHandle("artwork.zip", { create: true });
      const output = await handle.createWritable();
      await decompressTarXzToZip(stream, { signal }).pipeTo(output, { signal });
      signal.throwIfAborted();
      reader = new ZipReader(new BlobReader(await handle.getFile()), { useWebWorkers: false });
      const entries = orderArtworkPages(await reader.getEntries(), pageIds.length);
      signal.throwIfAborted();
      return {
        directory,
        reader,
        entries: entries.filter((entry): entry is FileEntry => !entry.directory),
      };
    } catch (error) {
      await cleanup();
      cleanup = null;
      throw error;
    }
  }

  async function load(pageId: string, requestSignal: AbortSignal): Promise<ReviewPage> {
    const signal = AbortSignal.any([lifetime.signal, requestSignal]);
    signal.throwIfAborted();
    const index = pageIds.indexOf(pageId);
    if (index < 0) throw new Error("页面不属于当前嵌稿包");
    // Page navigation cancels decoding, while the shared archive download continues.
    prepared ??= prepare().catch((error: unknown) => {
      prepared = null;
      throw error;
    });
    const archive = await prepared;
    signal.throwIfAborted();
    const entry = archive.entries[index];
    if (!entry) throw new Error("嵌稿包缺少当前页面");
    const filename = `page-${crypto.randomUUID()}.psd`;
    const handle = await archive.directory.getFileHandle(filename, { create: true });
    try {
      const output = await handle.createWritable();
      await entry.getData(output, { signal, useWebWorkers: false });
      signal.throwIfAborted();
      const decoded = await openPsdPage(await handle.getFile(), signal);
      const page: ReviewPage = {
        ...decoded,
        async dispose() {
          pages.delete(page);
          await decoded.dispose();
        },
      };
      pages.add(page);
      if (signal.aborted) {
        await page.dispose();
        signal.throwIfAborted();
      }
      return page;
    } finally {
      await archive.directory.removeEntry(filename);
    }
  }

  return {
    loadPage(pageId, signal) {
      const job = load(pageId, signal);
      pending.add(job);
      void job
        .finally(() => {
          pending.delete(job);
        })
        .catch(() => {
          /* Caller owns the error. */
        });
      return job;
    },
    async dispose() {
      if (disposed) return;
      disposed = true;
      lifetime.abort();
      await Promise.allSettled([...pending, ...(prepared ? [prepared] : [])]);
      await Promise.all(
        [...pages].map(async (page) => {
          await page.dispose();
        }),
      );
      await cleanup?.();
      cleanup = null;
    },
  };
}
