import type { ApiClient } from "@/api/client";
import {
  allocateArtworkImage,
  allocatePageArtworks,
  confirmArtworkImage,
  listPageArtworks,
} from "@/api/page-artwork/page-artwork-api";
import { useAppStore } from "@/route/business/session/session-store";
import { toApiRequestError } from "@/route/business/request-error";
import { mergeArtworkManifest } from "./artwork-manifest";
import { createArtworkStaging } from "./artwork-staging";
import { writeArtwork } from "./artwork-write";
import { ArtworkBatchArchive } from "./artwork-batch-archive";
import type {
  ArtworkBatch,
  ArtworkBatchSnapshot,
  ArtworkPageTask,
  ArtworkTask,
} from "./artwork-batch-types";
import type { Result } from "@/shared/utility/result";

const chapterLocks = new Set<string>();
type BatchArgs = {
  client: ApiClient;
  chapterId: string;
  files: readonly File[];
  includeArchive: boolean;
  targetId?: string;
  onChanged: () => void;
  onCompleted?: () => void;
};

function unwrap<T>(result: Result<T>): T {
  if (!result.success) throw toApiRequestError(result);
  return result.data;
}

function initialSnapshot(pages: ArtworkPageTask[], includeArchive: boolean): ArtworkBatchSnapshot {
  const archiveTask: ArtworkTask[] = includeArchive
    ? [
        {
          id: "archive",
          name: "PSD 嵌稿压缩包",
          kind: "archive",
          phase: "queued",
          progress: null,
          error: null,
          reused: false,
        },
      ]
    : [];
  const pageTasks = pages.map(
    (page): ArtworkTask => ({
      id: page.id,
      name: page.input.name,
      kind: "page",
      phase: "queued",
      progress: null,
      error: null,
      reused: false,
    }),
  );
  return { running: false, error: null, tasks: [...archiveTask, ...pageTasks] };
}

export class ArtworkBatchRuntime implements ArtworkBatch {
  private readonly args: BatchArgs;
  private readonly generation = useAppStore.getState().generation;
  private readonly listeners = new Set<() => void>();
  private readonly pages: ArtworkPageTask[];
  private readonly staging;
  private readonly archive: ArtworkBatchArchive;
  private snapshot: ArtworkBatchSnapshot;
  private abort = new AbortController();
  private disposed = false;
  private active: Promise<void> | null = null;
  private readonly unsubscribe: () => void;

  constructor(args: BatchArgs, files: File[]) {
    this.args = args;
    this.pages = files.map((input, index) => ({
      id: String(index),
      input,
      putDone: false,
      done: false,
    }));
    this.snapshot = initialSnapshot(this.pages, args.includeArchive);
    this.staging = createArtworkStaging(this.pages, (id, change) => {
      this.patch(id, change);
    });
    this.archive = new ArtworkBatchArchive(
      { client: args.client, chapterId: args.chapterId, files, enabled: args.includeArchive },
      {
        patch: (id, change) => {
          this.patch(id, change);
        },
        write: (request) => this.write(request),
        check: () => {
          this.check();
        },
        fail: (id, error) => {
          this.fail(id, error);
        },
        changed: () => {
          this.changed();
        },
        signal: () => this.abort.signal,
      },
    );
    this.unsubscribe = useAppStore.subscribe((state) => {
      if (state.generation !== this.generation) this.cancel();
    });
  }

  private publish(change: Partial<ArtworkBatchSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...change };
    for (const listener of this.listeners) listener();
  }

  private patch(id: string, change: Partial<ArtworkTask>): void {
    this.publish({
      tasks: this.snapshot.tasks.map((task) => (task.id === id ? { ...task, ...change } : task)),
    });
  }

  private async write<T>(request: () => Promise<Result<T>>): Promise<T> {
    return unwrap(await writeArtwork(this.args.chapterId, this.abort.signal, request));
  }

  private check(): void {
    this.abort.signal.throwIfAborted();
    if (this.disposed || this.generation !== useAppStore.getState().generation) {
      throw new DOMException("会话已变更，上传已停止", "AbortError");
    }
  }

  private changed(): void {
    if (!this.disposed && this.generation === useAppStore.getState().generation) {
      this.args.onChanged();
    }
  }

  private fail(id: string, error: unknown): void {
    this.patch(id, {
      phase: this.abort.signal.aborted ? "cancelled" : "failed",
      error: error instanceof Error ? error.message : String(error),
      progress: null,
    });
  }

  private async allocateTargetPage(page: ArtworkPageTask): Promise<void> {
    const prepared = page.prepared;
    const targetId = this.args.targetId;
    if (!prepared || !targetId) throw new Error("预览尚未准备");
    page.allocation = await this.write(() =>
      allocateArtworkImage(
        this.args.client,
        targetId,
        {
          rawIdent: page.input.name,
          imageHash: prepared.hash,
          ext: "webp",
          newByteLen: prepared.file.size,
        },
        this.abort.signal,
      ),
    );
  }

  private async allocateChapterPages(pending: ArtworkPageTask[]): Promise<void> {
    const existing = unwrap(
      await listPageArtworks(this.args.client, this.args.chapterId, this.abort.signal),
    );
    this.check();
    const prepared = pending.map((page) => {
      if (!page.prepared) throw new Error("预览尚未准备");
      return page.prepared;
    });
    const plan = mergeArtworkManifest(existing, prepared);
    const allocated = await this.write(() =>
      allocatePageArtworks(this.args.client, this.args.chapterId, plan.pages, this.abort.signal),
    );
    if (allocated.length !== plan.pages.length) {
      throw new Error("服务器返回的成稿数量与上传清单不一致，请刷新后重试。");
    }
    for (const [index, page] of pending.entries()) {
      const position = plan.positions[index];
      const allocation = position === undefined ? undefined : allocated[position];
      if (!allocation) throw new Error("服务器未返回成稿上传信息");
      page.allocation = allocation;
    }
  }

  private async allocatePages(): Promise<void> {
    const pending = this.pages.filter((page) => !page.allocation);
    if (pending.length === 0) return;
    for (const page of pending) this.patch(page.id, { phase: "allocating", error: null });
    if (this.args.targetId) {
      const firstPending = pending[0];
      if (firstPending) await this.allocateTargetPage(firstPending);
    } else await this.allocateChapterPages(pending);
    this.changed();
    this.check();
  }

  private async renewPageAllocation(page: ArtworkPageTask): Promise<void> {
    const prepared = page.prepared;
    const allocation = page.allocation;
    if (!prepared || !allocation) throw new Error("成稿尚未分配");
    if (
      page.putDone ||
      !["failed", "cancelled"].includes(
        this.snapshot.tasks.find((task) => task.id === page.id)?.phase ?? "",
      )
    )
      return;
    page.allocation = await this.write(() =>
      allocateArtworkImage(
        this.args.client,
        allocation.pageArtworkId,
        {
          rawIdent: page.input.name,
          imageHash: prepared.hash,
          newByteLen: prepared.file.size,
          ext: "webp",
        },
        this.abort.signal,
      ),
    );
    this.check();
  }

  private async putPage(page: ArtworkPageTask): Promise<void> {
    const allocation = page.allocation;
    const prepared = page.prepared;
    if (!allocation || !prepared || !allocation.slot || page.putDone) return;
    this.patch(page.id, { phase: "uploading", progress: 0, error: null });
    unwrap(
      await this.args.client.putPresigned({
        url: allocation.slot.putUrl,
        headers: allocation.slot.headers,
        file: prepared.file,
        signal: this.abort.signal,
        onProgress: (progress) => {
          this.patch(page.id, { progress });
        },
      }),
    );
    page.putDone = true;
    this.check();
  }

  private async confirmPage(page: ArtworkPageTask): Promise<void> {
    const allocation = page.allocation;
    if (!allocation) throw new Error("成稿尚未分配");
    if (allocation.slot) {
      this.patch(page.id, { phase: "confirming", progress: null, error: null });
      await this.write(() =>
        confirmArtworkImage(
          this.args.client,
          allocation.pageArtworkId,
          allocation.imageVersion,
          this.abort.signal,
        ),
      );
      this.check();
    }
    page.done = true;
    this.patch(page.id, {
      phase: "done",
      progress: 100,
      reused: allocation.slot === null,
      error: null,
    });
    this.changed();
  }

  private async uploadPage(page: ArtworkPageTask): Promise<void> {
    if (page.done) return;
    try {
      this.check();
      await this.renewPageAllocation(page);
      await this.putPage(page);
      await this.confirmPage(page);
    } catch (error) {
      this.fail(page.id, error);
    }
  }

  private async uploadPageQueue(): Promise<void> {
    await this.staging.prepare(this.abort.signal);
    await this.allocatePages();
    const queue = this.pages.filter((page) => !page.done);
    const worker = async (): Promise<void> => {
      while (queue.length > 0 && !this.abort.signal.aborted) {
        const page = queue.shift();
        if (page) await this.uploadPage(page);
      }
    };
    await Promise.all([worker(), worker()]);
  }

  private async runPhases(): Promise<void> {
    this.check();
    await this.archive.prepare();
    this.check();
    await this.archive.upload();
    this.check();
    if (this.args.includeArchive && !this.archive.done) {
      this.publish({ error: "PSD 压缩包上传未完成，请重试。" });
      return;
    }
    await this.uploadPageQueue();
    this.check();
    this.publishCompletion();
  }

  private publishCompletion(): void {
    const incomplete =
      this.pages.some((page) => !page.done) || (this.args.includeArchive && !this.archive.done);
    if (incomplete) {
      this.publish({ error: "部分任务未完成，已完成的上传已保留，请重试失败项。" });
    } else this.args.onCompleted?.();
  }

  private finish(): void {
    if (this.abort.signal.aborted)
      this.publish({
        tasks: this.snapshot.tasks.map((task) =>
          task.phase === "done" ? task : { ...task, phase: "cancelled", progress: null },
        ),
      });
    this.publish({ running: false });
    chapterLocks.delete(this.args.chapterId);
    this.changed();
  }

  private async execute(): Promise<void> {
    if (chapterLocks.has(this.args.chapterId)) {
      this.publish({ error: "当前章节已有上传任务，请等待完成后重试。" });
      return;
    }
    chapterLocks.add(this.args.chapterId);
    this.abort = new AbortController();
    this.publish({ running: true, error: null });
    try {
      await this.runPhases();
    } catch (error) {
      this.publish({
        error: this.abort.signal.aborted
          ? "已停止剩余任务，已完成的上传已保留。"
          : error instanceof Error
            ? error.message
            : String(error),
      });
    } finally {
      this.finish();
    }
  }

  getSnapshot(): ArtworkBatchSnapshot {
    return this.snapshot;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  run(): Promise<void> {
    if (this.disposed) return Promise.resolve();
    this.active ??= this.execute().finally(() => {
      this.active = null;
    });
    return this.active;
  }

  cancel(): void {
    this.abort.abort();
  }

  async dispose(): Promise<void> {
    this.disposed = true;
    this.cancel();
    this.unsubscribe();
    await this.active;
    try {
      await this.archive.dispose();
    } finally {
      await this.staging.dispose();
    }
  }
}
