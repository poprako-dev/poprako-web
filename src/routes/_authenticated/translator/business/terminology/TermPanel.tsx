import { useCallback } from "react";
import { Plus } from "lucide-react";
import clsx from "clsx";
import type { TermInfo } from "@/routes/_authenticated/translator/business/terminology/term";
import type { TermbaseInfo } from "@/routes/_authenticated/translator/business/terminology/termbase";
import type { TerminologyDataSource } from "@/routes/_authenticated/translator/business/contract/terminology";
import type { ResultFailure } from "@/shared/utility/result";
import { usePaginatedList } from "@/routes/_authenticated/translator/business/terminology/use-paginated-list";
import { useLongPress } from "@/shared/hook/use-long-press";
import { InfiniteTerminologyList } from "@/routes/_authenticated/translator/business/terminology/InfiniteTerminologyList";

const PAGE_SIZE = 30;

type Props = {
  dataSource: TerminologyDataSource;
  termbase: TermbaseInfo;
  query: string;
  revision: number;
  onCreate: () => void;
  onEdit: (term: TermInfo) => void;
  onError: (error: ResultFailure) => void;
};

type RowProps = {
  term: TermInfo;
  onEdit?: () => void;
};

function TermRow({ term, onEdit }: RowProps): React.ReactElement {
  const longPress = useLongPress({ onLongPress: () => onEdit?.() });

  return (
    <div
      role="listitem"
      {...(onEdit ? longPress : {})}
      onPointerLeave={onEdit ? longPress.onPointerCancel : undefined}
      title={onEdit ? "长按编辑术语" : term.comment}
      className={clsx(
        "flex min-h-8 items-center gap-3 border-b border-border/60",
        "px-2.5 py-1 last:border-b-0 transition-colors hover:bg-surface-hover",
        onEdit ? "touch-none select-none cursor-pointer" : "select-text",
      )}
    >
      <p className="min-w-0 flex-1 truncate text-xs font-semibold text-foreground">{term.source}</p>
      <div className="flex max-w-[68%] flex-wrap justify-end gap-1">
        {term.targets.length > 0 ? (
          term.targets.map((target, index) => (
            <div
              key={`${term.id}:${target}:${String(index)}`}
              className={clsx(
                "rounded-md border border-primary/20 bg-primary/10 px-1.5 py-px",
                "text-[10px] leading-4 text-primary-text",
              )}
            >
              {target}
            </div>
          ))
        ) : (
          <span className="text-[11px] text-muted-foreground">暂无译名</span>
        )}
      </div>
    </div>
  );
}

function normalizedQuery(value: string): string | undefined {
  const query = value.trim();
  return query.length > 0 ? query : undefined;
}

export function TermPanel({
  dataSource,
  termbase,
  query,
  revision,
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
    enabled: true,
    queryKey: `terms:${termbase.id}:${query.trim()}:${String(revision)}`,
    pageSize: PAGE_SIZE,
    loadPage,
    onError,
  });

  return (
    <>
      <div className="flex items-center gap-2 border-b border-border/80 px-2.5 py-2">
        <span
          className={clsx(
            "min-w-0 flex-1 truncate",
            "text-sm font-semibold leading-4 text-foreground",
          )}
        >
          {termbase.name}
        </span>
        <span
          className={clsx(
            "shrink-0 rounded-md border px-1 py-px text-[9px] font-medium",
            termbase.comicId
              ? "border-primary/20 bg-primary/10 text-primary-text"
              : "border-border bg-surface-hover text-muted-foreground",
          )}
        >
          {termbase.comicId ? "本作" : "团队"}
        </span>
        {termbase.comicId && (
          <button
            type="button"
            aria-label="新建术语"
            title="新建术语"
            onClick={onCreate}
            className={clsx(
              "flex size-7 shrink-0 items-center justify-center rounded-md border",
              "border-border bg-surface-panel text-muted-foreground transition-colors",
              "hover:border-primary/20 hover:bg-primary/15 hover:text-foreground",
            )}
          >
            <Plus size={13} />
          </button>
        )}
      </div>
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
            {...(termbase.comicId
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
