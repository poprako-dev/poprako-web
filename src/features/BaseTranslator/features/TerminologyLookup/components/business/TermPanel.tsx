import { useCallback } from "react";
import clsx from "clsx";
import type { TermbaseInfo } from "@/types/termbase";
import type { TerminologyDataSource } from "@/features/BaseTranslator/types/terminology";
import { usePaginatedList } from "../../hook/usePaginatedList";
import InfiniteTerminologyList from "./InfiniteTerminologyList";

const PAGE_SIZE = 30;

type Props = {
  dataSource: TerminologyDataSource;
  termbase: TermbaseInfo;
  query: string;
  onError: (error: string) => void;
};

function normalizedQuery(value: string) {
  const query = value.trim();
  return query.length > 0 ? query : undefined;
}

export default function TermPanel({
  dataSource,
  termbase,
  query,
  onError,
}: Props) {
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
    queryKey: `terms:${termbase.id}:${query.trim()}`,
    pageSize: PAGE_SIZE,
    loadPage,
    onError,
  });

  return (
    <>
      <div className="flex items-center gap-2 border-b border-stone-200/80 px-2.5 py-2">
        <span
          className={clsx(
            "min-w-0 flex-1 truncate",
            "text-sm font-semibold leading-4 text-stone-800",
          )}
        >
          {termbase.name}
        </span>
        <span
          className={clsx(
            "shrink-0 rounded-sm border px-1 py-px text-[9px] font-medium",
            termbase.comicId
              ? "border-green-100 bg-green-50 text-stone-600"
              : "border-stone-200 bg-stone-50 text-stone-500",
          )}
        >
          {termbase.comicId ? "本作" : "团队"}
        </span>
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
          <article
            key={term.id}
            role="listitem"
            className={clsx(
              "flex min-h-8 items-center gap-3 border-b border-stone-200/55",
              "px-2.5 py-1 last:border-b-0",
              "select-text transition-colors hover:bg-stone-50",
            )}
          >
            <p
              title={term.comment}
              className="min-w-0 flex-1 truncate text-xs font-semibold text-stone-700"
            >
              {term.source}
            </p>
            <div className="flex max-w-[68%] flex-wrap justify-end gap-1">
              {term.targets.length > 0 ? (
                term.targets.map((target, index) => (
                  <div
                    key={`${term.id}:${index}`}
                    className={clsx(
                      "rounded-sm border border-green-100 bg-green-50/60 px-1.5 py-px",
                      "text-[10px] leading-4 text-primary-text",
                    )}
                  >
                    {target}
                  </div>
                ))
              ) : (
                <span className="text-[11px] text-stone-400">暂无译名</span>
              )}
            </div>
          </article>
        ))}
      </InfiniteTerminologyList>
    </>
  );
}
