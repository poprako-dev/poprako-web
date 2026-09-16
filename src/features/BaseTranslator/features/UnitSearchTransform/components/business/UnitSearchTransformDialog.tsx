/* eslint-disable no-console -- dialog reports recoverable API failures for diagnostics. */
/* eslint-disable jsx-a11y/no-static-element-interactions -- tree interaction. */
import { useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { ChevronRight, Loader2 } from "lucide-react";
import AppDialog, { AppDialogAction } from "@/components/ui/AppDialog";
import { useToastStore } from "@/components/ui/NotificationToast";
import { showLocalApiFailure, showLocalCaughtError } from "@/api/util";
import type { Page } from "@/types/page";
import { unitId } from "@/types/unit";
import type {
  UnitSearchMatch,
  UnitSearchTransformDataSource,
  UnitTextPart,
} from "@/features/BaseTranslator/types/unitSearchTransform";
import CircleSelector, {
  type SelectionState,
} from "../ui/CircleSelector";
import HighlightedText from "../ui/HighlightedText";
import {
  MAX_SELECTED_UNIT_COUNT,
  defaultSelectedUnitIds,
  groupUnitSearchMatches,
  normalizeSearchPhrase,
  togglePageSelection,
  toggleUnitSelection,
  unitSearchText,
} from "../../searchTransform";

interface Props {
  pages: Page[];
  part: UnitTextPart;
  currentPageId: string;
  dataSource: UnitSearchTransformDataSource;
  onBeforeSearch: () => Promise<void>;
  runExclusive: (operation: () => Promise<void>) => Promise<void>;
  onRefreshCurrentPage: () => Promise<void>;
  onNavigate: (pageId: string, unitId?: string) => Promise<void>;
  onClose: () => void;
}

type SearchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; matches: UnitSearchMatch[]; phrase: string };

export default function UnitSearchTransformDialog({
  pages,
  part,
  currentPageId,
  dataSource,
  onBeforeSearch,
  runExclusive,
  onRefreshCurrentPage,
  onNavigate,
  onClose,
}: Props) {
  const [searchValue, setSearchValue] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [searchState, setSearchState] = useState<SearchState>({
    status: "idle",
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [expandedPageIds, setExpandedPageIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [isTransforming, setIsTransforming] = useState(false);
  const requestIdRef = useRef(0);
  const showToast = useToastStore((state) => state.showToast);

  const matches = useMemo(
    () => searchState.status === "ready" ? searchState.matches : [],
    [searchState],
  );
  const groups = useMemo(
    () => groupUnitSearchMatches(matches, pages),
    [matches, pages],
  );
  const isTransformEnabled = matches.length > 0;
  const canTransform = isTransformEnabled && targetValue.length > 0
    && selectedIds.size > 0 && !isTransforming;

  function resetSearchSnapshot() {
    requestIdRef.current += 1;
    setSearchState({ status: "idle" });
    setSelectedIds(new Set());
    setExpandedPageIds(new Set());
    setTargetValue("");
  }

  function commitSearchResult(resultMatches: UnitSearchMatch[], phrase: string) {
    setSearchState({ status: "ready", matches: resultMatches, phrase });
    setSelectedIds(defaultSelectedUnitIds(resultMatches));
    setExpandedPageIds(new Set());
  }

  // The boolean selects whether the save phase precedes a search operation.
  // eslint-disable-next-line unicorn/consistent-boolean-name
  async function search(shouldSaveBeforeSearch: boolean) {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setSearchState({ status: "loading" });
    setSelectedIds(new Set());
    setExpandedPageIds(new Set());

    if (shouldSaveBeforeSearch) {
      try {
        await onBeforeSearch();
      } catch (error) {
        if (requestIdRef.current !== requestId) {return false;}
        console.error("[UnitSearchTransformDialog] 搜索前保存失败", error);
        setSearchState({
          status: "error",
          message: "当前页保存失败，未执行搜索",
        });
        return false;
      }
    }

    try {
      const normalizedPhrase = normalizeSearchPhrase(searchValue);
      const result = await dataSource.search({ part, phrase: normalizedPhrase });
      if (requestIdRef.current !== requestId) {return false;}

      if (!result.success) {
        setSearchState({ status: "error", message: result.error });
        return false;
      }

      commitSearchResult(result.data, normalizedPhrase);
      return true;
    } catch (error) {
      if (requestIdRef.current !== requestId) {return false;}
      console.error("[UnitSearchTransformDialog] 搜索失败", error);
      setSearchState({
        status: "error",
        message: "搜索失败，请重试",
      });
      return false;
    }
  }

  async function handleTransform() {
    if (!canTransform || searchState.status !== "ready") {return;}

    const selectedMatches = searchState.matches.filter((match) =>
      selectedIds.has(unitId(match.unit)),
    );
    setIsTransforming(true);

    try {
      await runExclusive(async () => {
      const result = await dataSource.transform({
        part,
        origin: searchState.phrase,
        target: targetValue,
        unitIds: selectedMatches.map((match) => unitId(match.unit)),
      });
      if (!result.success) {
        console.error("[UnitSearchTransformDialog] 替换失败", result.error);
        showLocalApiFailure(result, showToast);
        return;
      }

      const isAffectsCurrentPage = selectedMatches.some(
        (match) => match.pageId === currentPageId,
      );
      const refreshResult = await Promise.allSettled([
        search(false),
        isAffectsCurrentPage ? onRefreshCurrentPage() : Promise.resolve(),
      ]);
      const isSearchRefreshed = refreshResult[0].status === "fulfilled"
        && refreshResult[0].value;
      const isPageRefreshed = refreshResult[1].status === "fulfilled";

      if (!isSearchRefreshed || !isPageRefreshed) {
        requestIdRef.current += 1;
        setSearchState({
          status: "error",
          message: "替换已完成，但刷新失败。请重新搜索以恢复最新结果。",
        });
        setSelectedIds(new Set());
        console.error("[UnitSearchTransformDialog] 替换后的数据刷新失败", refreshResult);
        showToast("替换已完成，但刷新失败", "error");
        return;
      }

      showToast("替换请求已完成", "success");
      });
    } catch (error) {
      console.error("[UnitSearchTransformDialog] 替换请求异常", error);
      showLocalCaughtError(error, showToast, "替换失败，请重试");
    } finally {
      setIsTransforming(false);
    }
  }

  async function handleNavigate(pageId: string, targetUnitId?: string) {
    if (isTransforming) {return;}
    requestIdRef.current += 1;
    onClose();
    await onNavigate(pageId, targetUnitId);
  }

  const preview = (() => {
    if (searchState.status === "loading") {
      return (
        <div className="flex h-full items-center justify-center text-slate-300">
          <Loader2 className="animate-spin" size={20} />
        </div>
      );
    }
    if (searchState.status === "error") {
      return (
        <div className="flex h-full items-center justify-center px-6 text-center">
          <p className="text-xs leading-relaxed text-(--color-red-500)">
            {searchState.message}
          </p>
        </div>
      );
    }
    if (searchState.status === "ready" && matches.length === 0) {
      return (
        <div className="flex h-full items-center justify-center">
          <p className="text-xs text-slate-300">没有找到匹配内容</p>
        </div>
      );
    }
    if (searchState.status !== "ready") {return null;}

    return (
      <div role="tree" aria-label="搜索结果" className="divide-y divide-slate-100">
        {groups.map((group) => {
          const pageIds = group.matches.map((match) => unitId(match.unit));
          const selectedCount = pageIds.filter((id) => selectedIds.has(id)).length;
          const selectionState: SelectionState = selectedCount === 0
            ? "unchecked"
            : (selectedCount === pageIds.length ? "checked" : "mixed");
          const isExpanded = expandedPageIds.has(group.page.id);

          return (
            <div key={group.page.id} role="treeitem" aria-expanded={isExpanded}
              aria-selected={false} tabIndex={0}>
              <div
                onDoubleClick={() => void handleNavigate(group.page.id)}
                className={clsx(
                  "flex h-9 cursor-default items-center gap-2 px-2",
                  "select-none transition-colors hover:bg-slate-50",
                )}
              >
                <CircleSelector
                  label={`选择第 ${String(group.page.index + 1)} 页全部匹配项`}
                  state={selectionState}
                  onClick={() => {
                    const missingCount = pageIds.filter(
                      (id) => !selectedIds.has(id),
                    ).length;
                    const remainingCapacity = MAX_SELECTED_UNIT_COUNT
                      - selectedIds.size;
                    const nextIds = togglePageSelection(selectedIds, group.matches);
                    if (missingCount > remainingCapacity && selectedCount < pageIds.length) {
                      showToast("一次最多选择 100 个 Unit", "info");
                    }
                    setSelectedIds(nextIds);
                  }}
                />
                <span className="min-w-0 flex-1 text-xs font-semibold text-slate-600">
                  第 {group.page.index + 1} 页
                </span>
                <span
                  className={clsx(
                    "min-w-5 text-right text-[10px] font-medium",
                    "tabular-nums text-slate-400",
                  )}
                >
                  {group.matches.length}
                </span>
                <button
                  type="button"
                  aria-label={isExpanded ? "折叠页面" : "展开页面"}
                  aria-expanded={isExpanded}
                  onClick={(event) => {
                    event.stopPropagation();
                    setExpandedPageIds((current) => {
                      const nextIds = new Set(current);
                      if (isExpanded) {nextIds.delete(group.page.id);}
                      else {nextIds.add(group.page.id);}
                      return nextIds;
                    });
                  }}
                  onDoubleClick={(event) => { event.stopPropagation(); }}
                  className="flex size-6 items-center justify-center text-slate-300"
                >
                  <ChevronRight
                    size={15}
                    className={clsx(
                      "transition-transform duration-200 ease-out",
                      "motion-reduce:transition-none",
                      isExpanded && "rotate-90",
                    )}
                  />
                </button>
              </div>
              <div
                role="group"
                aria-hidden={!isExpanded}
                inert={!isExpanded}
                className={clsx(
                  "grid bg-slate-50/50 transition-[grid-template-rows,border-color]",
                  "duration-200 ease-out motion-reduce:transition-none",
                  isExpanded
                    ? "grid-rows-[1fr] border-t border-slate-100"
                    : "grid-rows-[0fr] border-t border-transparent",
                )}
              >
                <div
                  className={clsx(
                    "min-h-0 overflow-hidden transition-opacity duration-150",
                    "motion-reduce:transition-none",
                    isExpanded ? "opacity-100 delay-75" : "opacity-0",
                  )}
                >
                  {group.matches.map((match) => {
                    const matchUnitId = unitId(match.unit);
                    const isChecked = selectedIds.has(matchUnitId);
                    const isDisabled = !isChecked
                      && selectedIds.size >= MAX_SELECTED_UNIT_COUNT;

                    return (
                      <div
                        key={matchUnitId}
                        role="treeitem" aria-selected={isChecked} tabIndex={0}
                        onDoubleClick={() =>
                          void handleNavigate(group.page.id, matchUnitId)}
                        className={clsx(
                          "flex min-h-9 cursor-default items-start gap-2 py-1.5 pl-7 pr-3",
                          "transition-colors hover:bg-white",
                        )}
                      >
                        <CircleSelector
                          label="选择该 Unit"
                          state={isChecked ? "checked" : "unchecked"}
                          disabled={isDisabled}
                          onClick={() => {
                            setSelectedIds(toggleUnitSelection(selectedIds, matchUnitId));
                          }}
                        />
                        <p className="min-w-0 flex-1 text-xs leading-5 text-slate-600">
                          <HighlightedText
                            text={unitSearchText(match, part)}
                            phrase={searchState.phrase}
                          />
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  })();

  return (
    <AppDialog
      title="搜索与替换"
      locked={isTransforming}
      onClose={onClose}
      bodyClassName="space-y-3"
      footer={(
        <div className="grid grid-cols-2 gap-2">
          <AppDialogAction
            onClick={() => void search(true)}
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
      )}
    >
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-500">
          查找短语
        </span>
        <input
          value={searchValue}
          disabled={isTransforming}
          onChange={(event) => {
            setSearchValue(event.target.value);
            resetSearchSnapshot();
          }}
          aria-label="查找短语"
          className={clsx(
            "h-8 w-full rounded-md border border-slate-200 bg-white px-2.5",
            "text-sm text-slate-700 shadow-sm shadow-slate-100 outline-none",
            "transition-colors focus:border-slate-300",
          )}
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-500">
          替换短语
        </span>
        <input
          value={targetValue}
          disabled={!isTransformEnabled || isTransforming}
          onChange={(event) => { setTargetValue(event.target.value); }}
          aria-label="替换短语"
          className={clsx(
            "h-8 w-full rounded-md border border-slate-200 bg-white px-2.5",
            "text-sm text-slate-700 shadow-sm shadow-slate-100 outline-none",
            "transition-colors focus:border-slate-300",
            "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-300",
          )}
        />
      </label>
      <section
        aria-label="搜索结果预览"
        className={clsx(
          "h-60 overflow-y-auto rounded-md border border-slate-200 bg-white",
        )}
      >
        {searchState.status === "ready" && matches.length > 0 && (
          <div
            className={clsx(
              "sticky top-0 z-10 flex h-7 items-center justify-between border-b",
              "border-slate-100 bg-white/95 px-3 text-[10px] text-slate-400",
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
        {preview}
      </section>
    </AppDialog>
  );
}
