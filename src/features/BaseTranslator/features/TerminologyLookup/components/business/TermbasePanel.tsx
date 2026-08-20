import { useCallback } from "react";
import { Search } from "lucide-react";
import clsx from "clsx";
import type { TermbaseInfo } from "@/types/termbase";
import type { TerminologyDataSource } from "@/features/BaseTranslator/types/terminology";
import { usePaginatedList } from "../../hook/usePaginatedList";
import InfiniteTerminologyList from "./InfiniteTerminologyList";

const PAGE_SIZE = 30;

type Props = {
  dataSource: TerminologyDataSource;
  query: string;
  searchQuery: string;
  selectedTermbase?: TermbaseInfo;
  onQueryChange: (value: string) => void;
  onSelect: (termbase: TermbaseInfo) => void;
  onError: (error: string) => void;
};

function normalizedQuery(value: string) {
  const query = value.trim();
  return query.length > 0 ? query : undefined;
}

export default function TermbasePanel({
  dataSource,
  query,
  searchQuery,
  selectedTermbase,
  onQueryChange,
  onSelect,
  onError,
}: Props) {
  const loadPage = useCallback(
    (offset: number, limit: number) => dataSource.listTermbases({
      fuzzyName: normalizedQuery(searchQuery),
      offset,
      limit,
    }),
    [dataSource, searchQuery],
  );
  const list = usePaginatedList({
    enabled: true,
    queryKey: `termbases:${searchQuery.trim()}`,
    pageSize: PAGE_SIZE,
    loadPage,
    onError,
  });

  return (
    <>
      <div className="border-b border-stone-200/80 p-1.5">
        <label className="relative block">
          <Search
            size={14}
            strokeWidth={1.8}
            className={clsx(
              "pointer-events-none absolute left-2 top-1/2 -translate-y-1/2",
              "text-stone-400",
            )}
          />
          <span className="sr-only">搜索术语库名称</span>
          <input
            autoFocus
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="搜索术语库名称"
            className={clsx(
              "h-7 w-full rounded-sm border border-stone-200 bg-stone-50/60",
              "pl-7 pr-2.5 text-[11px] text-stone-700 outline-none",
              "placeholder:text-stone-400 focus:border-stone-300 focus:bg-white",
            )}
          />
        </label>
      </div>
      <InfiniteTerminologyList
        itemCount={list.items.length}
        hasMore={list.hasMore}
        isInitialLoading={list.isInitialLoading}
        isLoadingMore={list.isLoadingMore}
        error={list.error}
        emptyMessage="没有找到术语库"
        role="listbox"
        ariaLabel="术语库列表"
        onLoadMore={list.loadMore}
        onRetry={list.retry}
      >
        {list.items.map((termbase) => {
          const isSelected = termbase.id === selectedTermbase?.id;
          const scope = termbase.comicId ? "本作" : "团队";

          return (
            <button
              key={termbase.id}
              type="button"
              role="option"
              aria-selected={isSelected}
              onClick={() => onSelect(termbase)}
              className={clsx(
                "flex min-h-7 w-full items-center gap-3 px-2.5 py-1 text-left",
                "border-b border-stone-200/55 last:border-b-0",
                "transition-colors hover:bg-stone-50",
                isSelected && "bg-green-50",
              )}
            >
              <span className="flex min-w-0 max-w-[68%] items-center gap-1.5">
                <span className="min-w-0 truncate text-xs font-medium text-stone-700">
                  {termbase.name}
                </span>
                <span
                  className={clsx(
                    "shrink-0 border-l border-stone-200 pl-1.5",
                    "text-[10px] tabular-nums text-stone-400",
                  )}
                >
                  {termbase.termCount} 条
                </span>
                <span
                  className={clsx(
                    "shrink-0 rounded-sm border px-1 py-px",
                    "text-[9px] font-medium leading-none",
                    termbase.comicId
                      ? "border-green-100 bg-green-50 text-stone-600"
                      : "border-stone-200 bg-stone-50 text-stone-500",
                  )}
                >
                  {scope}
                </span>
              </span>
              <span className="min-w-0 flex-1 truncate text-right text-[10px] text-stone-400">
                {termbase.description || "暂无描述"}
              </span>
            </button>
          );
        })}
      </InfiniteTerminologyList>
    </>
  );
}
