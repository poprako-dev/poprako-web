import type { JSX } from "react/jsx-runtime";
import { type ReactNode, type RefObject, useEffect, useRef } from "react";
import { BookOpenText, RefreshCcw } from "lucide-react";
import clsx from "clsx";
import { LoadingCircle } from "@/shared/component/LoadingCircle";

type Props = {
  children: ReactNode;
  itemCount: number;
  hasMore: boolean;
  isInitialLoading: boolean;
  isLoadingMore: boolean;
  error?: string | undefined;
  emptyMessage: string;
  role: "list" | "listbox";
  ariaLabel: string;
  onLoadMore: () => void;
  onRetry: () => void;
};

function useSentinelObserver(
  sentinelRef: RefObject<HTMLDivElement | null>,
  scrollRef: RefObject<HTMLDivElement | null>,
  hasMore: boolean,
  onLoadMore: () => void,
): void {
  useEffect(() => {
    const sentinel = sentinelRef.current;
    const scrollContainer = scrollRef.current;
    if (!sentinel || !scrollContainer) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore) onLoadMore();
      },
      { root: scrollContainer, rootMargin: "72px 0px" },
    );
    observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, [hasMore, onLoadMore, scrollRef, sentinelRef]);
}

function useLoadVisibleSentinel(
  sentinelRef: RefObject<HTMLDivElement | null>,
  scrollRef: RefObject<HTMLDivElement | null>,
  previousLoadingRef: RefObject<boolean>,
  hasMore: boolean,
  isInitialLoading: boolean,
  isLoadingMore: boolean,
  onLoadMore: () => void,
): void {
  useEffect(() => {
    const isLoading = isInitialLoading || isLoadingMore;
    const wasLoading = previousLoadingRef.current;
    previousLoadingRef.current = isLoading;
    if (!wasLoading || isLoading || !hasMore) return;
    const scrollContainer = scrollRef.current;
    const sentinel = sentinelRef.current;
    if (!scrollContainer || !sentinel) return;
    const containerRect = scrollContainer.getBoundingClientRect();
    const sentinelRect = sentinel.getBoundingClientRect();
    if (sentinelRect.top < containerRect.bottom + 72) onLoadMore();
  }, [
    hasMore,
    isInitialLoading,
    isLoadingMore,
    onLoadMore,
    previousLoadingRef,
    scrollRef,
    sentinelRef,
  ]);
}

export function InfiniteTerminologyList({
  children,
  itemCount,
  hasMore,
  isInitialLoading,
  isLoadingMore,
  error,
  emptyMessage,
  role,
  ariaLabel,
  onLoadMore,
  onRetry,
}: Props): JSX.Element {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const previousLoadingRef = useRef(isInitialLoading || isLoadingMore);

  useSentinelObserver(sentinelRef, scrollRef, hasMore, onLoadMore);
  useLoadVisibleSentinel(
    sentinelRef,
    scrollRef,
    previousLoadingRef,
    hasMore,
    isInitialLoading,
    isLoadingMore,
    onLoadMore,
  );

  if (isInitialLoading) {
    return (
      <div className="flex min-h-28 flex-1 items-center justify-center">
        <LoadingCircle size={18} aria-label="正在加载术语数据" />
      </div>
    );
  }

  if (error && itemCount === 0) {
    return (
      <div className="flex min-h-28 flex-1 flex-col items-center justify-center gap-2 px-4">
        <p className="text-center text-[11px] leading-4 text-ink-stone-500">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className={clsx(
            "inline-flex items-center gap-1 rounded-md border px-2 py-1",
            "border-line-stone-200 bg-surface-white text-[11px] font-medium text-ink-stone-600",
            "transition-colors hover:border-line-stone-300 hover:text-ink-stone-900",
          )}
        >
          <RefreshCcw size={13} />
          重试
        </button>
      </div>
    );
  }

  if (itemCount === 0) {
    return (
      <div className="flex min-h-28 flex-1 flex-col items-center justify-center gap-1.5">
        <BookOpenText size={17} strokeWidth={1.5} className="text-icon-muted-warm" />
        <p className="text-[11px] text-text-muted-warm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      role="region"
      aria-label={`${ariaLabel}，可滚动`}
      tabIndex={0}
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
    >
      <div role={role} aria-label={ariaLabel}>
        {children}
      </div>
      <div ref={sentinelRef} className="flex min-h-6 items-center justify-center px-2">
        {isLoadingMore && <LoadingCircle size={17} aria-label="正在加载更多" />}
        {error && (
          <button
            type="button"
            onClick={onRetry}
            className="text-xs text-text-muted-warm underline-offset-2 hover:underline"
          >
            加载失败，点击重试
          </button>
        )}
        {!hasMore && !error && (
          <span className="text-[10px] tracking-wide text-text-muted-warm">已显示全部</span>
        )}
      </div>
    </div>
  );
}
