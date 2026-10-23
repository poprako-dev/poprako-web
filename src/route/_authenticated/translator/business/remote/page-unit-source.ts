import type { Result } from "@/shared/utility/result";
import type { ListPageUnitsResult } from "./translator-request";

type LoadUnits = (pageId: string, signal: AbortSignal) => Promise<Result<ListPageUnitsResult>>;
type CachedPage = { data: ListPageUnitsResult; expiresAt: number };
type PendingPage = {
  controller: AbortController;
  background: boolean;
  authoritative: boolean;
  promise: Promise<Result<ListPageUnitsResult>>;
};

const PREFETCH_TTL_MS = 5_000;
const PREFETCH_PAGE_LIMIT = 2;

// Each editor session owns a source. Only unconsumed adjacent-page responses are cached.
export class PageUnitSource {
  private readonly load: LoadUnits;
  private readonly now: () => number;
  private readonly cached = new Map<string, CachedPage>();
  private readonly pending = new Map<string, PendingPage>();
  private neighbors = new Set<string>();
  private queue: string[] = [];
  private mutations = 0;

  constructor(load: LoadUnits, now: () => number = Date.now) {
    this.load = load;
    this.now = now;
  }

  read(pageId: string, fresh = false): Promise<Result<ListPageUnitsResult>> {
    this.queue = [];
    this.cancelBackground(fresh ? undefined : pageId);
    const existing = this.pending.get(pageId);
    if (existing && (!fresh || existing.authoritative)) {
      // Promotion keeps the original request alive when navigation consumes a prefetch.
      existing.background = false;
      return existing.promise;
    }
    if (fresh) this.invalidate(pageId);
    const cached = this.cached.get(pageId);
    this.cached.delete(pageId);
    if (cached && cached.expiresAt > this.now() && !this.mutations) {
      return Promise.resolve({ success: true, data: cached.data });
    }
    return this.start(pageId, false, fresh);
  }

  prefetch(pageIds: string[]): void {
    this.neighbors = new Set(pageIds.slice(0, PREFETCH_PAGE_LIMIT));
    for (const id of this.cached.keys()) {
      if (!this.neighbors.has(id)) this.cached.delete(id);
    }
    for (const [id, pending] of this.pending) {
      if (pending.background && !this.neighbors.has(id)) this.invalidate(id);
    }
    this.queue = [...this.neighbors].filter((id) => !this.hasFreshPage(id));
    this.pump();
  }

  async mutate<T>(pageId: string | undefined, write: () => Promise<T>): Promise<T> {
    this.mutations++;
    this.invalidateMutation(pageId);
    try {
      return await write();
    } finally {
      // Also reject reads started during the write, including ambiguous failed writes.
      this.invalidateMutation(pageId);
      this.mutations--;
    }
  }

  clear(): void {
    for (const pending of this.pending.values()) pending.controller.abort();
    this.pending.clear();
    this.cached.clear();
    this.neighbors.clear();
    this.queue = [];
  }

  private invalidateMutation(pageId: string | undefined): void {
    this.queue = [];
    this.cancelBackground();
    if (pageId === undefined) this.clear();
    else this.invalidate(pageId);
  }

  private invalidate(pageId: string): void {
    this.cached.delete(pageId);
    this.pending.get(pageId)?.controller.abort();
    this.pending.delete(pageId);
  }

  private cancelBackground(except?: string): void {
    for (const [id, pending] of this.pending) {
      if (pending.background && id !== except) this.invalidate(id);
    }
  }

  private hasFreshPage(pageId: string): boolean {
    const cached = this.cached.get(pageId);
    if (cached && cached.expiresAt > this.now()) return true;
    this.cached.delete(pageId);
    return this.pending.has(pageId);
  }

  private pump(): void {
    if (this.mutations || this.pending.size > 0) return;
    const pageId = this.queue.shift();
    if (pageId) void this.start(pageId, true);
  }

  private start(
    pageId: string,
    background: boolean,
    authoritative = false,
  ): Promise<Result<ListPageUnitsResult>> {
    const entry: PendingPage = {
      controller: new AbortController(),
      background,
      authoritative,
      promise: Promise.resolve().then(() => this.request(pageId, entry)),
    };
    this.pending.set(pageId, entry);
    return entry.promise;
  }

  private async request(pageId: string, entry: PendingPage): Promise<Result<ListPageUnitsResult>> {
    try {
      entry.controller.signal.throwIfAborted();
      const result = await this.load(pageId, entry.controller.signal);
      if (entry.controller.signal.aborted) {
        return { success: false, error: "页面请求已取消", failureKind: "aborted" };
      }
      if (result.success && entry.background && this.neighbors.has(pageId) && !this.mutations) {
        this.cached.set(pageId, { data: result.data, expiresAt: this.now() + PREFETCH_TTL_MS });
      }
      return result;
    } catch (error) {
      if (
        entry.controller.signal.aborted ||
        (error instanceof Error && error.name === "AbortError")
      ) {
        return { success: false, error: "页面请求已取消", failureKind: "aborted" };
      }
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    } finally {
      if (this.pending.get(pageId) === entry) this.pending.delete(pageId);
      this.pump();
    }
  }
}
