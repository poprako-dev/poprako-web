import { useCallback, useEffect, useState } from "react";
import type { ChapterWorkflowRecord } from "@/route/_authenticated/business/chapter/chapter-workflow-record";
import type { DetailContract } from "./comic-detail-type";
import { EMPTY_WORKFLOW_RECORD_STATE, WorkflowRecordCache } from "./workflow-record-cache";

export {
  WORKFLOW_RECORD_PAGE_SIZE,
  mergeWorkflowRecordHead,
  appendWorkflowRecordPage,
} from "./workflow-record-cache";

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
  onLoadWorkflowRecords: DetailContract["onLoadWorkflowRecords"];
};

type WorkflowRecordActions = {
  state: WorkflowRecordState;
  refreshLatest: () => Promise<void>;
  loadMore: () => Promise<void>;
};

export function useComicDetailWorkflowRecords({
  chapterId,
  enabled,
  onLoadWorkflowRecords,
}: Args): WorkflowRecordActions {
  const [cache, setCache] = useState<Record<string, WorkflowRecordState>>({});
  const [controller] = useState(() => new WorkflowRecordCache(setCache));

  const refreshLatest = useCallback(async (): Promise<void> => {
    if (!enabled || !chapterId) return;
    await controller.refresh(chapterId, onLoadWorkflowRecords);
  }, [chapterId, enabled, controller, onLoadWorkflowRecords]);

  const loadMore = useCallback(async (): Promise<void> => {
    if (!enabled || !chapterId) return;
    await controller.loadMore(chapterId, onLoadWorkflowRecords);
  }, [chapterId, enabled, controller, onLoadWorkflowRecords]);

  useEffect(() => {
    if (enabled && chapterId) {
      void refreshLatest();
    }
  }, [chapterId, enabled, refreshLatest]);

  return {
    state: chapterId
      ? (cache[chapterId] ?? EMPTY_WORKFLOW_RECORD_STATE)
      : EMPTY_WORKFLOW_RECORD_STATE,
    refreshLatest,
    loadMore,
  };
}
