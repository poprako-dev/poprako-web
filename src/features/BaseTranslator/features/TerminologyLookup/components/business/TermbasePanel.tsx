import { useCallback } from "react";
import { Plus, Search } from "lucide-react";
import clsx from "clsx";
import type { TermbaseInfo } from "@/types/termbase";
import type { TerminologyDataSource } from "@/features/BaseTranslator/types/terminology";
import { usePaginatedList } from "../../hook/usePaginatedList";
import { useLongPress } from "@/hooks/useLongPress";
import InfiniteTerminologyList from "./InfiniteTerminologyList";

const PAGE_SIZE = 30;

type Props = {
  dataSource: TerminologyDataSource;
  query: string;
  searchQuery: string;
  selectedTermbase?: TermbaseInfo;
  revision: number;
  onQueryChange: (value: string) => void;
  onSelect: (termbase: TermbaseInfo) => void;
  onCreate: () => void;
  onEdit: (termbase: TermbaseInfo) => void;
  onError: (error: string) => void;
};

type RowProps = {
  termbase: TermbaseInfo;
  isSelected: boolean;
  onSelect: () => void;
  onEdit?: () => void;
};

function TermbaseRow({ termbase, isSelected, onSelect, onEdit }: RowProps) {
  const scope = termbase.comicId ? "本作" : "团队";
  const longPress = useLongPress({
    onLongPress: () => onEdit?.(),
    onClick: onSelect,
  });

  return (
    <button
      type="button"
      role="option"
      aria-selected={isSelected}
      onClick={onEdit ? undefined : onSelect}
      {...(onEdit ? longPress : {})}
      onPointerLeave={onEdit ? longPress.onPointerCancel : undefined}
      title={onEdit ? "长按编辑术语库" : undefined}
      className={clsx(
        "flex min-h-7 w-full items-center gap-3 px-2.5 py-1 text-left",
        "border-b border-stone-200/55 last:border-b-0",
        "transition-colors hover:bg-stone-50",
        onEdit && "touch-none select-none",
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
}

function normalizedQuery(value: string) {
  const query = value.trim();
  return query.length > 0 ? query : undefined;
}

export default function TermbasePanel({
  dataSource,
  query,
  searchQuery,
  selectedTermbase,
  revision,
  onQueryChange,
  onSelect,
  onCreate,
  onEdit,
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
    queryKey: `termbases:${searchQuery.trim()}:${revision}`,
    pageSize: PAGE_SIZE,
    loadPage,
    onError,
  });

  return (
    <>
      <div className="flex gap-1.5 border-b border-stone-200/80 p-1.5">
        <label className="relative min-w-0 flex-1">
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
        <button
          type="button"
          aria-label="新建术语库"
          title="新建术语库"
          onClick={onCreate}
          className={clsx(
            "flex size-7 shrink-0 items-center justify-center rounded-sm border",
            "border-stone-200 bg-white text-stone-500 transition-colors",
            "hover:border-green-100 hover:bg-green-50 hover:text-stone-700",
          )}
        >
          <Plus size={13} />
        </button>
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
        {list.items.map((termbase) => (
          <TermbaseRow
            key={termbase.id}
            termbase={termbase}
            isSelected={termbase.id === selectedTermbase?.id}
            onSelect={() => onSelect(termbase)}
            onEdit={termbase.comicId ? () => onEdit(termbase) : undefined}
          />
        ))}
      </InfiniteTerminologyList>
    </>
  );
}
