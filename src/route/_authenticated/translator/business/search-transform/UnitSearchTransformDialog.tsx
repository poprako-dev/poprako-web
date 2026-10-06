import type { JSX } from "react/jsx-runtime";
import { useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { AppDialog, AppDialogAction } from "@/shared/component/AppDialog";
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
  MAX_SELECTED_UNIT_COUNT,
} from "@/route/_authenticated/translator/business/search-transform/search-transform";
import { SearchResultList } from "@/route/_authenticated/translator/business/search-transform/SearchResultList";

import type { EditorSearchCoordinator } from "../editor/editor-search-coordinator";

type Props = {
  pages: Page[];
  part: UnitTextPart;
  coordinator: EditorSearchCoordinator;
  onClose: () => void;
};

type SearchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; matches: UnitSearchMatch[]; phrase: string };

export function UnitSearchTransformDialog({
  pages,
  part,
  coordinator,
  onClose,
}: Props): JSX.Element {
  const [searchValue, setSearchValue] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [searchState, setSearchState] = useState<SearchState>({
    status: "idle",
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [isTransforming, setIsTransforming] = useState(false);
  const requestIdRef = useRef(0);
  const showToast = useToastStore((state) => state.showToast);

  const matches = useMemo(
    () => (searchState.status === "ready" ? searchState.matches : []),
    [searchState],
  );
  const groups = useMemo(() => groupUnitSearchMatches(matches, pages), [matches, pages]);
  const isTransformEnabled = matches.length > 0;
  const canTransform =
    isTransformEnabled && targetValue.length > 0 && selectedIds.size > 0 && !isTransforming;

  function resetSearchSnapshot(): void {
    requestIdRef.current += 1;
    setSearchState({ status: "idle" });
    setSelectedIds(new Set());
    setTargetValue("");
  }

  function commitSearchResult(resultMatches: UnitSearchMatch[], phrase: string): void {
    setSearchState({ status: "ready", matches: resultMatches, phrase });
    setSelectedIds(defaultSelectedUnitIds(resultMatches));
  }

  async function search(): Promise<boolean> {
    const requestId = ++requestIdRef.current;
    setSearchState({ status: "loading" });
    setSelectedIds(new Set());

    try {
      const result = await coordinator.search(searchValue);
      if (requestIdRef.current !== requestId) return false;

      if (!result.success) {
        setSearchState({ status: "error", message: result.error });
        return false;
      }

      commitSearchResult(result.data.matches, result.data.phrase);
      return true;
    } catch (error) {
      if (requestIdRef.current !== requestId) return false;
      console.error("[UnitSearchTransformDialog] 搜索失败", error);
      setSearchState({
        status: "error",
        message: "搜索失败，请重试",
      });
      return false;
    }
  }

  async function handleTransform(): Promise<void> {
    if (!canTransform || searchState.status !== "ready") return;

    const selectedMatches = searchState.matches.filter((match) =>
      selectedIds.has(unitId(match.unit)),
    );
    setIsTransforming(true);

    try {
      const result = await coordinator.transform(searchState.phrase, targetValue, selectedMatches);
      if (result.status === "failed") {
        showLocalApiFailure(result.failure, showToast);
      } else if (result.status === "refresh-failed") {
        requestIdRef.current += 1;
        setSearchState({
          status: "error",
          message: "替换已完成，但刷新失败。请重新搜索以恢复最新结果。",
        });
        setSelectedIds(new Set());
        showToast("替换已完成，但刷新失败", "error");
      } else {
        commitSearchResult(result.matches, searchState.phrase);
        showToast("替换请求已完成", "success");
      }
    } catch (error) {
      console.error("[UnitSearchTransformDialog] 替换请求异常", error);
      showLocalCaughtError(error, showToast, "替换失败，请重试");
    } finally {
      setIsTransforming(false);
    }
  }

  async function handleNavigate(pageId: string, targetUnitId?: string): Promise<void> {
    if (isTransforming) return;
    requestIdRef.current += 1;
    onClose();
    await coordinator.navigate(pageId, targetUnitId);
  }

  return (
    <AppDialog
      title="搜索与替换"
      locked={isTransforming}
      onClose={onClose}
      bodyClassName="space-y-3"
      footer={
        <div className="grid grid-cols-2 gap-2">
          <AppDialogAction
            onClick={() => void search()}
            disabled={searchState.status === "loading" || isTransforming}
          >
            {searchState.status === "loading" ? "搜索中" : "搜索"}
          </AppDialogAction>
          <AppDialogAction
            tone="brand"
            onClick={() => void handleTransform()}
            disabled={!canTransform}
          >
            {isTransforming ? "替换中" : "替换"}
          </AppDialogAction>
        </div>
      }
    >
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-ink-slate-500">查找短语</span>
        <input
          value={searchValue}
          disabled={isTransforming}
          onChange={(event) => {
            setSearchValue(event.target.value);
            resetSearchSnapshot();
          }}
          aria-label="查找短语"
          className={clsx(
            "h-8 w-full rounded-md border border-control-border bg-surface-white px-2.5",
            "text-sm text-ink-slate-700 shadow-sm shadow-shadow-slate-100 outline-none",
            "transition-colors focus:border-line-slate-300",
          )}
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-ink-slate-500">替换短语</span>
        <input
          value={targetValue}
          disabled={!isTransformEnabled || isTransforming}
          onChange={(event) => {
            setTargetValue(event.target.value);
          }}
          aria-label="替换短语"
          className={clsx(
            "h-8 w-full rounded-md border border-control-border bg-surface-white px-2.5",
            "text-sm text-ink-slate-700 shadow-sm shadow-shadow-slate-100 outline-none",
            "transition-colors focus:border-line-slate-300",
            "disabled:cursor-not-allowed disabled:bg-surface-slate-50 disabled:text-ink-slate-300",
          )}
        />
      </label>
      <section
        aria-label="搜索结果预览"
        className={clsx(
          "h-60 overflow-y-auto rounded-md border border-line-slate-200 bg-surface-white",
        )}
      >
        {searchState.status === "ready" && matches.length > 0 && (
          <div
            className={clsx(
              "sticky top-0 z-10 flex h-7 items-center justify-between border-b",
              "border-line-slate-100 bg-surface-white/95 px-3 text-[10px] text-ink-slate-600",
              "backdrop-blur-sm",
            )}
          >
            <span>{matches.length} 个匹配 Unit</span>
            <span>
              已选 {selectedIds.size}
              {matches.length > MAX_SELECTED_UNIT_COUNT ? " · 上限 100" : ""}
            </span>
          </div>
        )}
        <SearchResultList
          searchState={searchState}
          groups={groups}
          part={part}
          selectedIds={selectedIds}
          onSelectedIdsChange={setSelectedIds}
          onNavigate={handleNavigate}
        />
      </section>
    </AppDialog>
  );
}
