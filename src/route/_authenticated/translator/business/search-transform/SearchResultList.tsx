import { type ReactElement, useState } from "react";
import clsx from "clsx";
import { ChevronRight, Loader2 } from "lucide-react";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import type {
  UnitSearchMatch,
  UnitTextPart,
} from "@/route/_authenticated/translator/business/contract/unit-search-transform";
import {
  CircleSelector,
  type SelectionState,
} from "@/route/_authenticated/translator/business/search-transform/CircleSelector";
import { HighlightedText } from "@/route/_authenticated/translator/business/search-transform/HighlightedText";
import {
  MAX_SELECTED_UNIT_COUNT,
  togglePageSelection,
  toggleUnitSelection,
  type UnitSearchPageGroup,
  unitSearchText,
} from "@/route/_authenticated/translator/business/search-transform/search-transform";
import { unitId } from "@/route/_authenticated/translator/business/unit/unit";

type SearchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; matches: UnitSearchMatch[]; phrase: string };

type Props = {
  searchState: SearchState;
  groups: UnitSearchPageGroup[];
  part: UnitTextPart;
  selectedIds: Set<string>;
  onSelectedIdsChange: (ids: Set<string>) => void;
  onNavigate: (pageId: string, unitId?: string) => Promise<void>;
};

export function SearchResultList({
  searchState,
  groups,
  part,
  selectedIds,
  onSelectedIdsChange,
  onNavigate,
}: Props): ReactElement | null {
  const [expandedPageIds, setExpandedPageIds] = useState<Set<string>>(() => new Set());
  const showToast = useToastStore((state) => state.showToast);

  if (searchState.status === "loading") {
    return (
      <div className="flex h-full items-center justify-center text-text-muted-cool">
        <Loader2 className="animate-spin" size={20} />
      </div>
    );
  }
  if (searchState.status === "error") {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center">
        <p className="text-xs leading-relaxed text-ink-red-700">{searchState.message}</p>
      </div>
    );
  }
  if (searchState.status === "ready" && searchState.matches.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-xs text-text-muted-cool">没有找到匹配内容</p>
      </div>
    );
  }
  if (searchState.status !== "ready") return null;

  return (
    <div role="tree" aria-label="搜索结果" className="divide-y divide-separator-slate-100">
      {groups.map((group) => {
        const pageIds = group.matches.map((match) => unitId(match.unit));
        const selectedCount = pageIds.filter((id) => selectedIds.has(id)).length;
        const selectionState: SelectionState =
          selectedCount === 0
            ? "unchecked"
            : selectedCount === pageIds.length
              ? "checked"
              : "mixed";
        const isExpanded = expandedPageIds.has(group.page.id);

        return (
          <div
            key={group.page.id}
            role="treeitem"
            aria-expanded={isExpanded}
            aria-selected={false}
            tabIndex={0}
            onDoubleClick={(event) => {
              if (event.target instanceof HTMLElement && event.target.closest("button")) return;
              void onNavigate(group.page.id);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") void onNavigate(group.page.id);
            }}
          >
            <div
              className={clsx(
                "flex h-9 cursor-default items-center gap-2 px-2",
                "select-none transition-colors hover:bg-surface-slate-50",
              )}
            >
              <CircleSelector
                label={`选择第 ${String(group.page.index + 1)} 页全部匹配项`}
                state={selectionState}
                onClick={() => {
                  const missingCount = pageIds.filter((id) => !selectedIds.has(id)).length;
                  const remainingCapacity = MAX_SELECTED_UNIT_COUNT - selectedIds.size;
                  const nextIds = togglePageSelection(selectedIds, group.matches);
                  if (missingCount > remainingCapacity && selectedCount < pageIds.length) {
                    showToast("一次最多选择 100 个 Unit", "info");
                  }
                  onSelectedIdsChange(nextIds);
                }}
              />
              <span className="min-w-0 flex-1 text-xs font-semibold text-ink-slate-600">
                第 {group.page.index + 1} 页
              </span>
              <span
                className={clsx(
                  "min-w-5 text-right text-[10px] font-medium",
                  "tabular-nums text-text-muted-cool",
                )}
              >
                {group.matches.length}
              </span>
              <button
                type="button"
                aria-label={isExpanded ? "折叠页面" : "展开页面"}
                aria-expanded={isExpanded}
                onClick={() => {
                  setExpandedPageIds((current) => {
                    const nextIds = new Set(current);
                    if (isExpanded) nextIds.delete(group.page.id);
                    else nextIds.add(group.page.id);
                    return nextIds;
                  });
                }}
                className="flex size-6 items-center justify-center text-text-muted-cool"
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
                "grid bg-surface-slate-50/50 transition-[grid-template-rows,border-color]",
                "duration-200 ease-out motion-reduce:transition-none",
                isExpanded
                  ? "grid-rows-[1fr] border-t border-line-slate-100"
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
                  const matchId = unitId(match.unit);
                  const isChecked = selectedIds.has(matchId);
                  const isDisabled = !isChecked && selectedIds.size >= MAX_SELECTED_UNIT_COUNT;
                  return (
                    <div
                      key={matchId}
                      role="treeitem"
                      aria-selected={isChecked}
                      tabIndex={0}
                      onDoubleClick={() => void onNavigate(group.page.id, matchId)}
                      className={clsx(
                        "flex min-h-9 cursor-default items-start gap-2 py-1.5 pl-7 pr-3",
                        "transition-colors hover:bg-surface-white",
                      )}
                    >
                      <CircleSelector
                        label="选择该 Unit"
                        state={isChecked ? "checked" : "unchecked"}
                        disabled={isDisabled}
                        onClick={() => {
                          onSelectedIdsChange(toggleUnitSelection(selectedIds, matchId));
                        }}
                      />
                      <p className="min-w-0 flex-1 text-xs leading-5 text-ink-slate-600">
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
}
