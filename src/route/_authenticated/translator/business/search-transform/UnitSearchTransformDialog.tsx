import type { JSX } from "react/jsx-runtime";
import { useUnitSearchTransformDialog } from "./use-unit-search-transform-dialog";
import clsx from "clsx";
import { AppDialog, AppDialogAction } from "@/shared/component/AppDialog";
import type { Page } from "@/route/_authenticated/business/page/page";
import type { UnitTextPart } from "@/route/_authenticated/translator/business/contract/unit-search-transform";
import { MAX_SELECTED_UNIT_COUNT } from "@/route/_authenticated/translator/business/search-transform/search-transform";
import { SearchResultList } from "@/route/_authenticated/translator/business/search-transform/SearchResultList";

import type { EditorSearchCoordinator } from "../editor/editor-search-coordinator";

type Props = {
  pages: Page[];
  part: UnitTextPart;
  coordinator: EditorSearchCoordinator;
  onClose: () => void;
};

export function UnitSearchTransformDialog({
  pages,
  part,
  coordinator,
  onClose,
}: Props): JSX.Element {
  const {
    searchValue,
    setSearchValue,
    targetValue,
    setTargetValue,
    searchState,
    matches,
    groups,
    selectedIds,
    setSelectedIds,
    isTransforming,
    canTransform,
    resetSearchSnapshot,
    search,
    handleTransform,
    handleNavigate,
  } = useUnitSearchTransformDialog({ pages, part, coordinator, onClose });
  const isTransformEnabled = matches.length > 0;

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
