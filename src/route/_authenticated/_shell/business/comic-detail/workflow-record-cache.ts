import type { Dispatch, SetStateAction } from "react";
import type { ChapterWorkflowRecord } from "@/route/_authenticated/business/chapter/chapter-workflow-record";
import type { DetailContract } from "./comic-detail-type";
import type { WorkflowRecordState } from "./use-comic-detail-workflow-records";

export const WORKFLOW_RECORD_PAGE_SIZE = 20;
export const EMPTY_WORKFLOW_RECORD_STATE: WorkflowRecordState = {
  records: [],
  hasMore: false,
  loadedOnce: false,
  isLoading: false,
  isLoadingMore: false,
  error: null,
  loadMoreError: null,
};

type Cache = Record<string, WorkflowRecordState>;
type Loader = DetailContract["onLoadWorkflowRecords"];
type RecordResult = Awaited<ReturnType<Loader>>;

export function mergeWorkflowRecordHead(
  head: ChapterWorkflowRecord[],
  existing: ChapterWorkflowRecord[],
): ChapterWorkflowRecord[] {
  const headIds = new Set(head.map((record) => record.id));
  return [...head, ...existing.filter((record) => !headIds.has(record.id))];
}

export function appendWorkflowRecordPage(
  existing: ChapterWorkflowRecord[],
  page: ChapterWorkflowRecord[],
): ChapterWorkflowRecord[] {
  const existingIds = new Set(existing.map((record) => record.id));
  return [...existing, ...page.filter((record) => !existingIds.has(record.id))];
}

export class WorkflowRecordCache {
  private cache: Cache = {};
  private readonly refreshing = new Set<string>();
  private readonly loadingMore = new Set<string>();
  private readonly versions = new Map<string, number>();
  private readonly setCache: Dispatch<SetStateAction<Cache>>;

  constructor(setCache: Dispatch<SetStateAction<Cache>>) {
    this.setCache = setCache;
  }

  private update(
    chapterId: string,
    update: (state: WorkflowRecordState) => WorkflowRecordState,
  ): void {
    this.setCache((previous) => {
      const next = {
        ...previous,
        [chapterId]: update(previous[chapterId] ?? EMPTY_WORKFLOW_RECORD_STATE),
      };
      this.cache = next;
      return next;
    });
  }

  async refresh(chapterId: string, load: Loader): Promise<void> {
    if (this.refreshing.has(chapterId)) return;
    this.refreshing.add(chapterId);
    const version = (this.versions.get(chapterId) ?? 0) + 1;
    this.versions.set(chapterId, version);
    this.update(chapterId, (state) => ({
      ...state,
      isLoading: !state.loadedOnce,
      isLoadingMore: false,
      error: null,
      loadMoreError: null,
    }));

    try {
      const result = await load({ chapterId, offset: 0, limit: WORKFLOW_RECORD_PAGE_SIZE + 1 });
      if (this.versions.get(chapterId) !== version) return;
      this.receiveHead(chapterId, result);
    } catch (error) {
      if (this.versions.get(chapterId) !== version) return;
      console.error("[ComicDetailModal] 加载 workflow records 异常:", error);
      this.headFailure(chapterId, "加载活动记录失败");
    } finally {
      this.refreshing.delete(chapterId);
    }
  }

  private receiveHead(chapterId: string, result: RecordResult): void {
    if (!result.success) {
      console.error("[ComicDetailModal] 加载 workflow records 失败:", result.error);
      this.headFailure(chapterId, result.error);
      return;
    }
    const head = result.data.slice(0, WORKFLOW_RECORD_PAGE_SIZE);
    const hasMore = result.data.length > WORKFLOW_RECORD_PAGE_SIZE;
    this.update(chapterId, (state) => ({
      ...state,
      records: state.loadedOnce ? mergeWorkflowRecordHead(head, state.records) : head,
      hasMore: state.loadedOnce && state.records.length > 0 ? state.hasMore : hasMore,
      loadedOnce: true,
      isLoading: false,
      error: null,
    }));
  }

  private headFailure(chapterId: string, error: string): void {
    this.update(chapterId, (state) => ({ ...state, loadedOnce: true, isLoading: false, error }));
  }

  async loadMore(chapterId: string, load: Loader): Promise<void> {
    if (this.refreshing.has(chapterId) || this.loadingMore.has(chapterId)) return;
    const snapshot = this.cache[chapterId] ?? EMPTY_WORKFLOW_RECORD_STATE;
    if (!snapshot.loadedOnce || !snapshot.hasMore || snapshot.isLoading) return;
    this.loadingMore.add(chapterId);
    const version = this.versions.get(chapterId) ?? 0;
    this.update(chapterId, (state) => ({ ...state, isLoadingMore: true, loadMoreError: null }));

    try {
      const result = await load({
        chapterId,
        offset: snapshot.records.length,
        limit: WORKFLOW_RECORD_PAGE_SIZE + 1,
      });
      if (this.versions.get(chapterId) !== version) return;
      this.receivePage(chapterId, result);
    } catch (error) {
      if (this.versions.get(chapterId) !== version) return;
      console.error("[ComicDetailModal] 加载更早 records 异常:", error);
      this.pageFailure(chapterId, "加载更早记录失败");
    } finally {
      this.loadingMore.delete(chapterId);
    }
  }

  private receivePage(chapterId: string, result: RecordResult): void {
    if (!result.success) {
      console.error("[ComicDetailModal] 加载更早 records 失败:", result.error);
      this.pageFailure(chapterId, result.error);
      return;
    }
    const page = result.data.slice(0, WORKFLOW_RECORD_PAGE_SIZE);
    this.update(chapterId, (state) => {
      const records = appendWorkflowRecordPage(state.records, page);
      return {
        ...state,
        records,
        hasMore:
          records.length > state.records.length && result.data.length > WORKFLOW_RECORD_PAGE_SIZE,
        isLoadingMore: false,
        loadMoreError: null,
      };
    });
  }

  private pageFailure(chapterId: string, loadMoreError: string): void {
    this.update(chapterId, (state) => ({ ...state, isLoadingMore: false, loadMoreError }));
  }
}
