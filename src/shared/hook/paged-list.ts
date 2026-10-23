import type { Result } from "@/shared/utility/result";

export type PageLoader<Item> = (
  offset: number,
  limit: number,
  signal?: AbortSignal,
) => Promise<Result<Item[]>>;

export type PagedListSnapshot<Item> = {
  items: Item[];
  isLoading: boolean;
  hasMore: boolean;
  error: string | null;
};

export class PagedList<Item> {
  private snapshot: PagedListSnapshot<Item> = {
    items: [],
    isLoading: true,
    hasMore: true,
    error: null,
  };
  private readonly listeners = new Set<() => void>();
  private active = false;
  private pending: AbortController | null = null;
  private offset = 0;
  private readonly loader: PageLoader<Item>;
  private readonly pageSize: number;

  constructor(loader: PageLoader<Item>, pageSize: number) {
    this.loader = loader;
    this.pageSize = pageSize;
  }

  getSnapshot = (): PagedListSnapshot<Item> => this.snapshot;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  start(): () => void {
    this.active = true;
    void this.loadMore();
    return () => {
      this.active = false;
      this.pending?.abort();
      this.pending = null;
    };
  }

  loadMore = (): Promise<void> => this.request(false);

  retry = (): Promise<void> => this.request(true);

  private publish(update: Partial<PagedListSnapshot<Item>>): void {
    this.snapshot = { ...this.snapshot, ...update };
    for (const listener of this.listeners) listener();
  }

  private isCurrent(controller: AbortController): boolean {
    return this.active && this.pending === controller && !controller.signal.aborted;
  }

  private async request(retry: boolean): Promise<void> {
    if (!this.active || this.pending || !this.snapshot.hasMore) return;
    if (this.snapshot.error && !retry) return;
    const controller = new AbortController();
    this.pending = controller;
    this.publish({ isLoading: true, error: null });
    try {
      const result = await this.loader(this.offset, this.pageSize, controller.signal);
      if (!this.isCurrent(controller)) return;
      if (!result.success) {
        console.error("[PagedList] 加载列表失败", result);
        this.publish({ error: result.error, isLoading: false });
        return;
      }
      this.offset += result.data.length;
      this.publish({
        items: [...this.snapshot.items, ...result.data],
        hasMore: result.data.length === this.pageSize,
        isLoading: false,
      });
    } catch (error) {
      if (!this.isCurrent(controller)) return;
      console.error("[PagedList] 加载列表异常", error);
      this.publish({
        error: error instanceof Error ? error.message : "加载列表失败",
        isLoading: false,
      });
    } finally {
      if (this.pending === controller) this.pending = null;
    }
  }
}
