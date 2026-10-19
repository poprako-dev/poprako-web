import { useCallback, type ReactNode } from "react";
import { Plus, Search } from "lucide-react";
import clsx from "clsx";
import type { TermbaseInfo } from "./termbase";
import type { TerminologyDataSource } from "./terminology-contract";
import type { ResultFailure } from "@/shared/utility/result";
import { usePaginatedList } from "./use-paginated-list";
import { TermbaseRow } from "./TermbaseRow";
import type { TermbaseExportActions } from "./use-termbase-export";
import { InfiniteTerminologyList } from "./InfiniteTerminologyList";

const PAGE_SIZE = 30;

type Props = {
  dataSource: TerminologyDataSource;
  termbaseExport: TermbaseExportActions;
  query: string;
  searchQuery: string;
  selectedTermbase?: TermbaseInfo;
  revision: number;
  canCreate: boolean;
  canEdit: (termbase: TermbaseInfo) => boolean;
  enabled?: boolean;
  directory?: boolean;
  header?: ReactNode;
  onQueryChange: (value: string) => void;
  onSelect: (termbase: TermbaseInfo) => void;
  onCreate: () => void;
  onEdit: (termbase: TermbaseInfo) => void;
  onError: (error: ResultFailure) => void;
};

function normalizedQuery(value: string): string | undefined {
  const query = value.trim();
  return query.length > 0 ? query : undefined;
}

export function TermbasePanel({
  dataSource,
  termbaseExport,
  query,
  searchQuery,
  selectedTermbase,
  revision,
  canCreate,
  canEdit,
  enabled = true,
  directory = false,
  header,
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
    enabled,
    queryKey: `termbases:${searchQuery.trim()}:${String(revision)}`,
    pageSize: PAGE_SIZE,
    loadPage,
    onError,
  });

  return (
    <>
      {header ?? (
        <div className="flex gap-1.5 border-b border-line-stone-200/80 p-1.5">
          <label className="relative min-w-0 flex-1">
            <Search
              size={14}
              strokeWidth={1.8}
              className={clsx(
                "pointer-events-none absolute left-2 top-1/2 -translate-y-1/2",
                "text-icon-muted-warm",
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
                "h-7 w-full rounded-md border border-control-border bg-surface-white",
                "pl-7 pr-2.5 text-[11px] text-ink-stone-700 outline-none",
                "shadow-sm shadow-shadow-slate-100 placeholder:text-text-muted-warm",
                "focus:border-line-slate-300",
              )}
            />
          </label>
          {canCreate && (
            <button
              type="button"
              aria-label="新建术语库"
              title="新建术语库"
              onClick={onCreate}
              className={clsx(
                "flex size-7 shrink-0 items-center justify-center rounded-md border",
                "border-line-stone-200 bg-surface-white text-text-muted-warm transition-colors",
                "hover:border-line-green-100 hover:bg-surface-green-50 hover:text-ink-stone-700",
              )}
            >
              <Plus size={13} />
            </button>
          )}
        </div>
      )}
      <InfiniteTerminologyList
        itemCount={list.items.length}
        hasMore={list.hasMore}
        isInitialLoading={list.isInitialLoading}
        isLoadingMore={list.isLoadingMore}
        error={list.error}
        emptyMessage="没有找到术语库"
        role="list"
        ariaLabel="术语库列表"
        onLoadMore={list.loadMore}
        onRetry={list.retry}
      >
        {list.items.map((termbase) => (
          <TermbaseRow
            key={termbase.id}
            termbase={termbase}
            directory={directory}
            isSelected={termbase.id === selectedTermbase?.id}
            isExporting={termbaseExport.exportingIds.has(termbase.id)}
            onExport={() => {
              void termbaseExport.exportTermbase(termbase.id);
            }}
            onSelect={() => {
              onSelect(termbase);
            }}
            {...(canEdit(termbase)
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
