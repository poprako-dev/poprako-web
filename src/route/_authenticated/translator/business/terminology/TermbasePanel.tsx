import { useCallback } from "react";
import { Plus, Search } from "lucide-react";
import clsx from "clsx";
import type { TermbaseInfo } from "@/route/_authenticated/translator/business/terminology/termbase";
import type { TerminologyDataSource } from "@/route/_authenticated/translator/business/contract/terminology";
import type { ResultFailure } from "@/shared/utility/result";
import { usePaginatedList } from "@/route/_authenticated/translator/business/terminology/use-paginated-list";
import { useLongPress } from "@/shared/hook/use-long-press";
import { InfiniteTerminologyList } from "@/route/_authenticated/translator/business/terminology/InfiniteTerminologyList";

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
  onError: (error: ResultFailure) => void;
};

type RowProps = {
  termbase: TermbaseInfo;
  isSelected: boolean;
  onSelect: () => void;
  onEdit?: () => void;
};

function TermbaseRow({ termbase, isSelected, onSelect, onEdit }: RowProps): React.ReactElement {
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
        "border-b border-border/60 last:border-b-0",
        "transition-colors hover:bg-surface-hover",
        onEdit && "touch-none select-none",
        isSelected && "bg-primary/10",
      )}
    >
      <span className="flex min-w-0 max-w-[68%] items-center gap-1.5">
        <span className="min-w-0 truncate text-xs font-medium text-foreground">
          {termbase.name}
        </span>
        <span
          className={clsx(
            "shrink-0 border-l border-border pl-1.5",
            "text-[10px] tabular-nums text-muted-foreground",
          )}
        >
          {termbase.termCount} 条
        </span>
        <span
          className={clsx(
            "shrink-0 rounded-md border px-1 py-px",
            "text-[9px] font-medium leading-none",
            termbase.comicId
              ? "border-primary/20 bg-primary/10 text-primary-text"
              : "border-border bg-surface-hover text-muted-foreground",
          )}
        >
          {scope}
        </span>
      </span>
      <span className="min-w-0 flex-1 truncate text-right text-[10px] text-muted-foreground">
        {termbase.description ?? "暂无描述"}
      </span>
    </button>
  );
}

function normalizedQuery(value: string): string | undefined {
  const query = value.trim();
  return query.length > 0 ? query : undefined;
}

export function TermbasePanel({
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
}: Props): React.ReactElement {
  const loadPage = useCallback(
    (offset: number, limit: number) =>
      dataSource.listTermbases({
        fuzzyName: normalizedQuery(searchQuery),
        offset,
        limit,
      }),
    [dataSource, searchQuery],
  );
  const list = usePaginatedList({
    enabled: true,
    queryKey: `termbases:${searchQuery.trim()}:${String(revision)}`,
    pageSize: PAGE_SIZE,
    loadPage,
    onError,
  });

  return (
    <>
      <div className="flex gap-1.5 border-b border-border/80 p-1.5">
        <label className="relative min-w-0 flex-1">
          <Search
            size={14}
            strokeWidth={1.8}
            className={clsx(
              "pointer-events-none absolute left-2 top-1/2 -translate-y-1/2",
              "text-muted-foreground",
            )}
          />
          <span className="sr-only">搜索术语库名称</span>
          <input
            value={query}
            onChange={(event) => {
              onQueryChange(event.target.value);
            }}
            placeholder="搜索术语库名称"
            className={clsx(
              "h-7 w-full rounded-md border border-border bg-surface-panel",
              "pl-7 pr-2.5 text-[11px] text-foreground outline-none",
              "shadow-sm shadow-foreground/5 placeholder:text-muted-foreground",
              "focus:border-border",
            )}
          />
        </label>
        <button
          type="button"
          aria-label="新建术语库"
          title="新建术语库"
          onClick={onCreate}
          className={clsx(
            "flex size-7 shrink-0 items-center justify-center rounded-md border",
            "border-border bg-surface-panel text-muted-foreground transition-colors",
            "hover:border-primary/20 hover:bg-primary/15 hover:text-foreground",
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
            onSelect={() => {
              onSelect(termbase);
            }}
            {...(termbase.comicId
              ? {
                  onEdit: () => {
                    onEdit(termbase);
                  },
                }
              : {})}
          />
        ))}
      </InfiniteTerminologyList>
    </>
  );
}
