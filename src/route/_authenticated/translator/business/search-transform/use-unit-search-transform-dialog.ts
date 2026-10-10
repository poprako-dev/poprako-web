import { useCallback, useMemo, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import { showLocalApiFailure, showLocalCaughtError } from "@/route/business/request-error";
import type { Page } from "@/route/_authenticated/business/page/page";
import { unitId } from "@/route/_authenticated/translator/business/unit/unit";
import type {
  UnitSearchMatch,
  UnitTextPart,
} from "@/route/_authenticated/translator/business/contract/unit-search-transform";
import {
  defaultSelectedUnitIds,
  groupUnitSearchMatches,
} from "@/route/_authenticated/translator/business/search-transform/search-transform";
import type { EditorSearchCoordinator } from "../editor/editor-search-coordinator";

export type SearchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; matches: UnitSearchMatch[]; phrase: string };

type Props = {
  pages: Page[];
  part: UnitTextPart;
  coordinator: EditorSearchCoordinator;
  onClose: () => void;
};

export function useUnitSearchTransformDialog({ pages, coordinator, onClose }: Props): DialogState {
  const state = useDialogState(pages);
  const requestId = useSearchRequestId();
  const showToast = useToastStore((state) => state.showToast);
  const commitSearchResult = createResultCommitter(state.setSearchState, state.setSelectedIds);
  const resetSearchSnapshot = createSnapshotResetter(
    requestId.invalidate,
    state.setSearchState,
    state.setSelectedIds,
    state.setTargetValue,
  );
  const search = createSearchAction(
    state.searchValue,
    coordinator,
    requestId,
    state.setSearchState,
    state.setSelectedIds,
    commitSearchResult,
  );
  const handleTransform = createTransformAction(
    state.canTransform,
    state.searchState,
    state.selectedIds,
    state.targetValue,
    coordinator,
    requestId.invalidate,
    state.setSearchState,
    state.setSelectedIds,
    state.setIsTransforming,
    commitSearchResult,
    showToast,
  );
  const handleNavigate = createNavigateAction(
    state.isTransforming,
    coordinator,
    requestId.invalidate,
    onClose,
  );

  return {
    ...state,
    resetSearchSnapshot,
    search,
    handleTransform,
    handleNavigate,
  };
}

function useSearchRequestId(): SearchRequestId {
  const ref = useRef(0);
  const next = useCallback(() => ++ref.current, []);
  const isCurrent = useCallback((request: number) => ref.current === request, []);
  return { next, isCurrent, invalidate: next };
}

interface SearchRequestId {
  next: () => number;
  isCurrent: (request: number) => boolean;
  invalidate: () => number;
}

type DialogState = ReturnType<typeof useDialogState> & {
  resetSearchSnapshot: () => void;
  search: () => Promise<boolean>;
  handleTransform: () => Promise<void>;
  handleNavigate: (pageId: string, targetUnitId?: string) => Promise<void>;
};

type StateSetter<T> = Dispatch<SetStateAction<T>>;

function useDialogState(pages: Page[]): {
  searchValue: string;
  setSearchValue: StateSetter<string>;
  targetValue: string;
  setTargetValue: StateSetter<string>;
  searchState: SearchState;
  setSearchState: StateSetter<SearchState>;
  matches: UnitSearchMatch[];
  groups: ReturnType<typeof groupUnitSearchMatches>;
  selectedIds: Set<string>;
  setSelectedIds: StateSetter<Set<string>>;
  isTransforming: boolean;
  setIsTransforming: StateSetter<boolean>;
  canTransform: boolean;
} {
  const [searchValue, setSearchValue] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [searchState, setSearchState] = useState<SearchState>({ status: "idle" });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [isTransforming, setIsTransforming] = useState(false);
  const matches = useMemo(
    () => (searchState.status === "ready" ? searchState.matches : []),
    [searchState],
  );
  const groups = useMemo(() => groupUnitSearchMatches(matches, pages), [matches, pages]);
  const canTransform =
    matches.length > 0 && targetValue.length > 0 && selectedIds.size > 0 && !isTransforming;
  return {
    searchValue,
    setSearchValue,
    targetValue,
    setTargetValue,
    searchState,
    setSearchState,
    matches,
    groups,
    selectedIds,
    setSelectedIds,
    isTransforming,
    setIsTransforming,
    canTransform,
  };
}

function createResultCommitter(
  setSearchState: StateSetter<SearchState>,
  setSelectedIds: StateSetter<Set<string>>,
): (matches: UnitSearchMatch[], phrase: string) => void {
  return (matches, phrase) => {
    setSearchState({ status: "ready", matches, phrase });
    setSelectedIds(defaultSelectedUnitIds(matches));
  };
}

function createSnapshotResetter(
  invalidate: () => number,
  setSearchState: StateSetter<SearchState>,
  setSelectedIds: StateSetter<Set<string>>,
  setTargetValue: StateSetter<string>,
): () => void {
  return () => {
    invalidate();
    setSearchState({ status: "idle" });
    setSelectedIds(new Set());
    setTargetValue("");
  };
}

function createSearchAction(
  searchValue: string,
  coordinator: EditorSearchCoordinator,
  requestId: SearchRequestId,
  setSearchState: StateSetter<SearchState>,
  setSelectedIds: StateSetter<Set<string>>,
  commitSearchResult: (matches: UnitSearchMatch[], phrase: string) => void,
): () => Promise<boolean> {
  return async () => {
    const currentRequestId = requestId.next();
    setSearchState({ status: "loading" });
    setSelectedIds(new Set());
    try {
      const result = await coordinator.search(searchValue);
      if (!requestId.isCurrent(currentRequestId)) return false;
      if (!result.success) {
        setSearchState({ status: "error", message: result.error });
        return false;
      }
      commitSearchResult(result.data.matches, result.data.phrase);
      return true;
    } catch (error) {
      if (!requestId.isCurrent(currentRequestId)) return false;
      console.error("[UnitSearchTransformDialog] 搜索失败", error);
      setSearchState({ status: "error", message: "搜索失败，请重试" });
      return false;
    }
  };
}

function createTransformAction(
  canTransform: boolean,
  searchState: SearchState,
  selectedIds: Set<string>,
  targetValue: string,
  coordinator: EditorSearchCoordinator,
  invalidate: () => number,
  setSearchState: StateSetter<SearchState>,
  setSelectedIds: StateSetter<Set<string>>,
  setIsTransforming: StateSetter<boolean>,
  commitSearchResult: (matches: UnitSearchMatch[], phrase: string) => void,
  showToast: (message: string, tone: "success" | "error") => void,
): () => Promise<void> {
  return async () => {
    if (!canTransform || searchState.status !== "ready") return;
    const selectedMatches = searchState.matches.filter((match) =>
      selectedIds.has(unitId(match.unit)),
    );
    setIsTransforming(true);
    try {
      await applyTransform(searchState, selectedMatches, targetValue, coordinator, {
        commitSearchResult,
        invalidateSearch: () => {
          invalidate();
        },
        setSearchState,
        setSelectedIds,
        showToast,
      });
    } catch (error) {
      console.error("[UnitSearchTransformDialog] 替换请求异常", error);
      showLocalCaughtError(error, showToast, "替换失败，请重试");
    } finally {
      setIsTransforming(false);
    }
  };
}

function createNavigateAction(
  isTransforming: boolean,
  coordinator: EditorSearchCoordinator,
  invalidate: () => number,
  onClose: () => void,
): (pageId: string, targetUnitId?: string) => Promise<void> {
  return async (pageId, targetUnitId) => {
    if (isTransforming) return;
    invalidate();
    onClose();
    await coordinator.navigate(pageId, targetUnitId);
  };
}

type TransformActions = {
  commitSearchResult: (matches: UnitSearchMatch[], phrase: string) => void;
  invalidateSearch: () => void;
  setSearchState: StateSetter<SearchState>;
  setSelectedIds: StateSetter<Set<string>>;
  showToast: (message: string, tone: "success" | "error") => void;
};

async function applyTransform(
  searchState: Extract<SearchState, { status: "ready" }>,
  selectedMatches: UnitSearchMatch[],
  targetValue: string,
  coordinator: EditorSearchCoordinator,
  actions: TransformActions,
): Promise<void> {
  const result = await coordinator.transform(searchState.phrase, targetValue, selectedMatches);
  if (result.status === "failed") {
    showLocalApiFailure(result.failure, actions.showToast);
    return;
  }
  if (result.status === "refresh-failed") {
    actions.invalidateSearch();
    actions.setSearchState({
      status: "error",
      message: "替换已完成，但刷新失败。请重新搜索以恢复最新结果。",
    });
    actions.setSelectedIds(new Set());
    actions.showToast("替换已完成，但刷新失败", "error");
    return;
  }
  actions.commitSearchResult(result.matches, searchState.phrase);
  actions.showToast("替换请求已完成", "success");
}
