import { useCallback, useEffect, useRef, useState } from "react";
import type { ChapterWorkflowRecord } from "@/types/chapterWorkflowRecord";
import type { ComicDetailModalProps } from "../types";

export const WORKFLOW_RECORD_PAGE_SIZE = 20;

export type WorkflowRecordState = {
  records: ChapterWorkflowRecord[];
  hasMore: boolean;
  loadedOnce: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  loadMoreError: string | null;
};

type Args = {
  chapterId: string | null;
  enabled: boolean;
  onLoadWorkflowRecords: ComicDetailModalProps["onLoadWorkflowRecords"];
};

const EMPTY_STATE: WorkflowRecordState = {
  records: [],
  hasMore: false,
  loadedOnce: false,
  isLoading: false,
  isLoadingMore: false,
  error: null,
  loadMoreError: null,
};

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
  return [
    ...existing,
    ...page.filter((record) => !existingIds.has(record.id)),
  ];
}

export function useComicDetailWorkflowRecords({
  chapterId,
  enabled,
  onLoadWorkflowRecords,
}: Args) {
  const [cache, setCache] = useState<Record<string, WorkflowRecordState>>({});
  const cacheRef = useRef(cache);
  const refreshingRef = useRef(new Set<string>());
  const loadingMoreRef = useRef(new Set<string>());
  const requestVersionsRef = useRef(new Map<string, number>());

  const updateChapterState = useCallback(
    (
      targetChapterId: string,
      update: (state: WorkflowRecordState) => WorkflowRecordState,
    ) => {
      setCache((previous) => {
        const next = {
          ...previous,
          [targetChapterId]: update(
            previous[targetChapterId] ?? EMPTY_STATE,
          ),
        };
        cacheRef.current = next;
        return next;
      });
    },
    [],
  );

  const refreshLatest = useCallback(async () => {
    if (!enabled || !chapterId || refreshingRef.current.has(chapterId)) {
      return;
    }

    refreshingRef.current.add(chapterId);
    const requestVersion =
      (requestVersionsRef.current.get(chapterId) ?? 0) + 1;
    requestVersionsRef.current.set(chapterId, requestVersion);
    updateChapterState(chapterId, (state) => ({
      ...state,
      isLoading: !state.loadedOnce,
      isLoadingMore: false,
      error: null,
      loadMoreError: null,
    }));

    try {
      const result = await onLoadWorkflowRecords({
        chapterId,
        offset: 0,
        limit: WORKFLOW_RECORD_PAGE_SIZE + 1,
      });

      if (requestVersionsRef.current.get(chapterId) !== requestVersion) return;

      if (!result.success) {
        console.error("[ComicDetailModal] 加载 workflow records 失败:", result.error);
        updateChapterState(chapterId, (state) => ({
          ...state,
          loadedOnce: true,
          isLoading: false,
          error: result.error,
        }));
        return;
      }

      const head = result.data.slice(0, WORKFLOW_RECORD_PAGE_SIZE);
      const responseHasMore = result.data.length > WORKFLOW_RECORD_PAGE_SIZE;
      updateChapterState(chapterId, (state) => ({
        ...state,
        records: state.loadedOnce
          ? mergeWorkflowRecordHead(head, state.records)
          : head,
        hasMore: state.loadedOnce && state.records.length > 0
          ? state.hasMore
          : responseHasMore,
        loadedOnce: true,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      if (requestVersionsRef.current.get(chapterId) !== requestVersion) return;
      console.error("[ComicDetailModal] 加载 workflow records 异常:", error);
      updateChapterState(chapterId, (state) => ({
        ...state,
        loadedOnce: true,
        isLoading: false,
        error: "加载活动记录失败",
      }));
    } finally {
      refreshingRef.current.delete(chapterId);
    }
  }, [chapterId, enabled, onLoadWorkflowRecords, updateChapterState]);

  const loadMore = useCallback(async () => {
    if (
      !enabled ||
      !chapterId ||
      refreshingRef.current.has(chapterId) ||
      loadingMoreRef.current.has(chapterId)
    ) {
      return;
    }

    const snapshot = cacheRef.current[chapterId] ?? EMPTY_STATE;
    if (!snapshot.loadedOnce || !snapshot.hasMore || snapshot.isLoading) return;

    loadingMoreRef.current.add(chapterId);
    const requestVersion = requestVersionsRef.current.get(chapterId) ?? 0;
    updateChapterState(chapterId, (state) => ({
      ...state,
      isLoadingMore: true,
      loadMoreError: null,
    }));

    try {
      const result = await onLoadWorkflowRecords({
        chapterId,
        offset: snapshot.records.length,
        limit: WORKFLOW_RECORD_PAGE_SIZE + 1,
      });

      if (requestVersionsRef.current.get(chapterId) !== requestVersion) return;

      if (!result.success) {
        console.error("[ComicDetailModal] 加载更早 records 失败:", result.error);
        updateChapterState(chapterId, (state) => ({
          ...state,
          isLoadingMore: false,
          loadMoreError: result.error,
        }));
        return;
      }

      const page = result.data.slice(0, WORKFLOW_RECORD_PAGE_SIZE);
      updateChapterState(chapterId, (state) => {
        const records = appendWorkflowRecordPage(state.records, page);
        return {
          ...state,
          records,
          hasMore:
            records.length > state.records.length &&
            result.data.length > WORKFLOW_RECORD_PAGE_SIZE,
          isLoadingMore: false,
          loadMoreError: null,
        };
      });
    } catch (error) {
      if (requestVersionsRef.current.get(chapterId) !== requestVersion) return;
      console.error("[ComicDetailModal] 加载更早 records 异常:", error);
      updateChapterState(chapterId, (state) => ({
        ...state,
        isLoadingMore: false,
        loadMoreError: "加载更早记录失败",
      }));
    } finally {
      loadingMoreRef.current.delete(chapterId);
    }
  }, [chapterId, enabled, onLoadWorkflowRecords, updateChapterState]);

  useEffect(() => {
    if (enabled && chapterId) void refreshLatest();
  }, [chapterId, enabled, refreshLatest]);

  return {
    state: chapterId ? cache[chapterId] ?? EMPTY_STATE : EMPTY_STATE,
    refreshLatest,
    loadMore,
  };
}
