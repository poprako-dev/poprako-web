import { useCallback, type ReactNode } from "react";
import { Plus } from "lucide-react";
import clsx from "clsx";
import type { TermInfo } from "./term";
import type { TermbaseInfo } from "./termbase";
import type { TerminologyDataSource } from "./terminology-contract";
import type { ResultFailure } from "@/shared/utility/result";
import { usePaginatedList } from "./use-paginated-list";
import { InfiniteTerminologyList } from "./InfiniteTerminologyList";
import { TermRow } from "./TermRow";

const PAGE_SIZE = 30;

type Props = {
  dataSource: TerminologyDataSource;
  termbase: TermbaseInfo;
  query: string;
  revision: number;
  canEdit: boolean;
  enabled?: boolean;
  directory?: boolean;
  header?: ReactNode;
  onCreate: () => void;
  onEdit: (term: TermInfo) => void;
  onError: (error: ResultFailure) => void;
};

function normalizedQuery(value: string): string | undefined {
  const query = value.trim();
  return query.length > 0 ? query : undefined;
}

export function TermPanel({
  dataSource,
  termbase,
  query,
  revision,
  canEdit,
  enabled = true,
  directory = false,
  header,
  onCreate,
  onEdit,
  onError,
}: Props): React.ReactElement {
  const loadPage = useCallback(
    (offset: number, limit: number) =>
      dataSource.listTerms({
        termbaseId: termbase.id,
        fuzzySource: normalizedQuery(query),
        offset,
        limit,
      }),
    [dataSource, query, termbase.id],
  );
  const list = usePaginatedList({
    enabled,
    queryKey: `terms:${termbase.id}:${query.trim()}:${String(revision)}`,
    pageSize: PAGE_SIZE,
    loadPage,
    onError,
  });

  return (
    <>
      {header ?? (
        <div className="flex items-center gap-2 border-b border-line-stone-200/80 px-2.5 py-2">
          <span
            className={clsx(
              "min-w-0 flex-1 truncate",
              "text-sm font-semibold leading-4 text-ink-stone-800",
            )}
          >
            {termbase.name}
          </span>
          <span
            className={clsx(
              "shrink-0 rounded-md border px-1 py-px text-[9px] font-medium",
              termbase.comicId
                ? "border-line-green-100 bg-surface-green-50 text-ink-stone-600"
                : "border-line-stone-200 bg-surface-stone-50 text-text-muted-warm",
            )}
          >
            {termbase.comicId ? "本作" : "团队"}
          </span>
          {canEdit && (
            <button
              type="button"
              aria-label="新建术语"
              title="新建术语"
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
        emptyMessage="没有匹配的术语"
        role="list"
        ariaLabel="术语列表"
        onLoadMore={list.loadMore}
        onRetry={list.retry}
      >
        {list.items.map((term) => (
          <TermRow
            key={term.id}
            term={term}
            directory={directory}
            {...(canEdit
              ? {
                  onEdit: () => {
                    onEdit(term);
                  },
                }
              : {})}
          />
        ))}
      </InfiniteTerminologyList>
    </>
  );
}
