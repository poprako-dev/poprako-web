import type { ApiClient } from "@/api/client";
import {
  allocatePageArtworks,
  allocateArtworkImage,
  confirmArtworkImage,
  listPageArtworks,
} from "@/api/page-artwork/page-artwork-api";
import { allocArtwork, markArtworkUploaded } from "@/api/chapter/artwork-api";
import { writeArtwork } from "./artwork-write";
import { createArtworkStaging } from "./artwork-staging";
import { useAppStore } from "@/route/business/session/session-store";
import { toApiRequestError } from "@/route/business/request-error";
import { compareArtworkNames } from "@/route/_authenticated/business/artwork/artwork";
import { mergeArtworkManifest } from "./artwork-manifest";
import { prepareArtwork, validateArtworkFiles } from "./artwork-upload";
import type { PreparedArtwork } from "./artwork-upload";
import type {
  ArtworkBatch,
  ArtworkBatchSnapshot,
  ArtworkPageTask,
  ArtworkTask,
} from "./artwork-batch-types";
import type { Result } from "@/shared/utility/result";

const chapterLocks = new Set<string>();
function unwrap<T>(result: Result<T>): T {
  if (!result.success) throw toApiRequestError(result);
  return result.data;
}
export function createArtworkBatch(args: {
  client: ApiClient;
  chapterId: string;
  files: readonly File[];
  includeArchive: boolean;
  targetId?: string;
  onChanged: () => void;
  onCompleted?: () => void;
}): ArtworkBatch {
  validateArtworkFiles(args.files);
  if (args.files.some((file) => !/\.psd$/iu.test(file.name)))
    throw new Error("请选择 PSD 文件，系统会自动生成在线预览。");
  const files = [...args.files].sort((a, b) => compareArtworkNames(a.name, b.name));
  const pages: ArtworkPageTask[] = files.map((input, index) => ({
    id: String(index),
    input,
    putDone: false,
    done: false,
  }));
  const archiveId = "archive";
  const listeners = new Set<() => void>();
  const generation = useAppStore.getState().generation;
  let snapshot: ArtworkBatchSnapshot = {
    running: false,
    error: null,
    tasks: [
      ...(args.includeArchive
        ? [
            {
              id: archiveId,
              name: "PSD 嵌稿压缩包",
              kind: "archive" as const,
              phase: "queued" as const,
              progress: null,
              error: null,
              reused: false,
            },
          ]
        : []),
      ...pages.map(
        (page): ArtworkTask => ({
          id: page.id,
          name: page.input.name,
          kind: "page",
          phase: "queued",
          progress: null,
          error: null,
          reused: false,
        }),
      ),
    ],
  };
  let abort = new AbortController();
  const staging = createArtworkStaging(pages, patch);
  let archive: PreparedArtwork | null = null;
  let archiveVersion: number | null = null;
  let archivePutDone = false;
  let archiveDone = false;
  let disposed = false;
  let active: Promise<void> | null = null;
  const unsubscribe = useAppStore.subscribe((state) => {
    if (state.generation !== generation) cancel();
  });
  function publish(change: Partial<ArtworkBatchSnapshot>): void {
    snapshot = { ...snapshot, ...change };
    for (const listener of listeners) listener();
  }
  function patch(id: string, change: Partial<ArtworkTask>): void {
    publish({
      tasks: snapshot.tasks.map((task) => (task.id === id ? { ...task, ...change } : task)),
    });
  }
  async function write<T>(request: () => Promise<Result<T>>): Promise<T> {
    return unwrap(await writeArtwork(args.chapterId, abort.signal, request));
  }
  function check(): void {
    abort.signal.throwIfAborted();
    if (disposed || generation !== useAppStore.getState().generation)
      throw new DOMException("会话已变更，上传已停止", "AbortError");
  }
  function changed(): void {
    if (!disposed && generation === useAppStore.getState().generation) args.onChanged();
  }
  function fail(id: string, error: unknown): void {
    patch(id, {
      phase: abort.signal.aborted ? "cancelled" : "failed",
      error: error instanceof Error ? error.message : String(error),
      progress: null,
    });
  }
  function cancel(): void {
    abort.abort();
  }
  async function allocate(): Promise<void> {
    const pending = pages.filter((page) => !page.allocation);
    if (pending.length === 0) return;
    for (const page of pending) patch(page.id, { phase: "allocating", error: null });
    if (args.targetId) {
      const page = pending[0];
      if (!page?.prepared) throw new Error("预览尚未准备");
      const prepared = page.prepared;
      const targetId = args.targetId;
      page.allocation = await write(() =>
        allocateArtworkImage(
          args.client,
          targetId,
          {
            rawIdent: page.input.name,
            imageHash: prepared.hash,
            ext: "webp",
            newByteLen: prepared.file.size,
          },
          abort.signal,
        ),
      );
      changed();
      check();
      return;
    }
    const existing = unwrap(await listPageArtworks(args.client, args.chapterId, abort.signal));
    check();
    const prepared = pending.map((page) => {
      if (!page.prepared) throw new Error("预览尚未准备");
      return page.prepared;
    });
    const plan = mergeArtworkManifest(existing, prepared);
    const allocated = await write(() =>
      allocatePageArtworks(args.client, args.chapterId, plan.pages, abort.signal),
    );
    if (allocated.length !== plan.pages.length)
      throw new Error("服务器返回的成稿数量与上传清单不一致，请刷新后重试。");
    for (const [index, page] of pending.entries()) {
      const position = plan.positions[index];
      const allocation = position === undefined ? undefined : allocated[position];
      if (!allocation) throw new Error("服务器未返回成稿上传信息");
      page.allocation = allocation;
    }
    changed();
    check();
  }
  async function uploadPage(page: ArtworkPageTask): Promise<void> {
    if (page.done) return;
    try {
      check();
      const prepared = page.prepared;
      let allocation = page.allocation;
      if (!prepared || !allocation) throw new Error("成稿尚未分配");
      if (
        !page.putDone &&
        ["failed", "cancelled"].includes(
          snapshot.tasks.find((task) => task.id === page.id)?.phase ?? "",
        )
      ) {
        const pageArtworkId = allocation.pageArtworkId;
        allocation = await write(() =>
          allocateArtworkImage(
            args.client,
            pageArtworkId,
            {
              rawIdent: page.input.name,
              imageHash: prepared.hash,
              newByteLen: prepared.file.size,
              ext: "webp",
            },
            abort.signal,
          ),
        );
        page.allocation = allocation;
        check();
      }
      if (allocation.slot && !page.putDone) {
        patch(page.id, { phase: "uploading", progress: 0, error: null });
        unwrap(
          await args.client.putPresigned({
            url: allocation.slot.putUrl,
            headers: allocation.slot.headers,
            file: prepared.file,
            signal: abort.signal,
            onProgress(progress) {
              patch(page.id, { progress });
            },
          }),
        );
        page.putDone = true;
        check();
      }
      if (allocation.slot) {
        patch(page.id, { phase: "confirming", progress: null, error: null });
        await write(() =>
          confirmArtworkImage(
            args.client,
            allocation.pageArtworkId,
            allocation.imageVersion,
            abort.signal,
          ),
        );
        check();
      }
      page.done = true;
      patch(page.id, {
        phase: "done",
        progress: 100,
        reused: allocation.slot === null,
        error: null,
      });
      changed();
    } catch (error) {
      fail(page.id, error);
    }
  }
  async function prepareArchive(): Promise<void> {
    if (!args.includeArchive || archive || archiveDone) return;
    try {
      patch(archiveId, { phase: "packing", progress: 0, error: null });
      const total = files.reduce((sum, file) => sum + file.size, 0);
      archive = await prepareArtwork(files, abort.signal, (progress) => {
        patch(archiveId, {
          progress: Math.min(99, (progress.processedBytes / Math.max(total, 1)) * 100),
        });
      });
      check();
      patch(archiveId, { phase: "prepared", progress: null });
    } catch (error) {
      fail(archiveId, error);
    }
  }
  async function uploadArchive(): Promise<void> {
    if (!args.includeArchive || archiveDone || !archive) return;
    try {
      check();
      if (!archivePutDone) {
        const prepared = archive;
        patch(archiveId, { phase: "allocating", progress: null, error: null });
        const allocation = await write(() =>
          allocArtwork(
            args.client,
            args.chapterId,
            prepared.hash,
            prepared.file.size,
            abort.signal,
          ),
        );
        archiveVersion = allocation.artworkVersion;
        check();
        if (allocation.slot) {
          patch(archiveId, { phase: "uploading", progress: 0 });
          unwrap(
            await args.client.putPresigned({
              url: allocation.slot.putUrl,
              headers: allocation.slot.headers,
              file: archive.file,
              signal: abort.signal,
              onProgress(progress) {
                patch(archiveId, { progress });
              },
            }),
          );
        }
        archivePutDone = true;
        check();
      }
      if (archiveVersion === null) throw new Error("压缩包尚未分配");
      patch(archiveId, { phase: "confirming", progress: null, error: null });
      const version = archiveVersion;
      await write(() => markArtworkUploaded(args.client, args.chapterId, version, abort.signal));
      check();
      archiveDone = true;
      patch(archiveId, { phase: "done", progress: 100 });
      changed();
    } catch (error) {
      fail(archiveId, error);
    }
  }
  async function execute(): Promise<void> {
    if (chapterLocks.has(args.chapterId)) {
      publish({ error: "当前章节已有上传任务，请等待完成后重试。" });
      return;
    }
    chapterLocks.add(args.chapterId);
    abort = new AbortController();
    publish({ running: true, error: null });
    try {
      check();
      await prepareArchive();
      check();
      await uploadArchive();
      check();
      if (args.includeArchive && !archiveDone) {
        publish({ error: "PSD 压缩包上传未完成，请重试。" });
        return;
      }
      await staging.prepare(abort.signal);
      await allocate();
      const queue = pages.filter((page) => !page.done);
      async function uploadWorker(): Promise<void> {
        while (queue.length > 0 && !abort.signal.aborted) {
          const page = queue.shift();
          if (page) await uploadPage(page);
        }
      }
      await Promise.all([uploadWorker(), uploadWorker()]);
      check();
      if (pages.some((page) => !page.done) || (args.includeArchive && !archiveDone)) {
        publish({ error: "部分任务未完成，已完成的上传已保留，请重试失败项。" });
      } else {
        args.onCompleted?.();
      }
    } catch (error) {
      publish({
        error: abort.signal.aborted
          ? "已停止剩余任务，已完成的上传已保留。"
          : error instanceof Error
            ? error.message
            : String(error),
      });
    } finally {
      if (abort.signal.aborted)
        publish({
          tasks: snapshot.tasks.map((task) =>
            task.phase === "done" ? task : { ...task, phase: "cancelled", progress: null },
          ),
        });
      publish({ running: false });
      chapterLocks.delete(args.chapterId);
      changed();
    }
  }
  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    run() {
      if (disposed) return Promise.resolve();
      active ??= execute().finally(() => {
        active = null;
      });
      return active;
    },
    cancel,
    async dispose() {
      disposed = true;
      cancel();
      unsubscribe();
      await active;
      try {
        await archive?.dispose();
      } finally {
        await staging.dispose();
      }
    },
  };
}
