import { useEffect, useRef, type ReactNode } from "react";
import { BookOpenText, RefreshCcw } from "lucide-react";
import clsx from "clsx";
import LoadingCircle from "@/components/ui/LoadingCircle";

type Props = {
  children: ReactNode;
  itemCount: number;
  hasMore: boolean;
  isInitialLoading: boolean;
  isLoadingMore: boolean;
  error?: string;
  emptyMessage: string;
  role: "list" | "listbox";
  ariaLabel: string;
  onLoadMore: () => void;
  onRetry: () => void;
};

export default function InfiniteTerminologyList({
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
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const previousLoadingRef = useRef(isInitialLoading || isLoadingMore);

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

    return () => observer.disconnect();
  }, [hasMore, onLoadMore]);

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
  }, [hasMore, isInitialLoading, isLoadingMore, onLoadMore]);

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
        <p className="text-center text-[11px] leading-4 text-stone-500">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className={clsx(
            "inline-flex items-center gap-1 rounded-sm border px-2 py-1",
            "border-stone-200 bg-white text-[11px] font-medium text-stone-600",
            "transition-colors hover:border-stone-300 hover:text-stone-900",
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
        <BookOpenText size={17} strokeWidth={1.5} className="text-stone-300" />
        <p className="text-[11px] text-stone-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      role={role}
      aria-label={ariaLabel}
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
    >
      {children}
      <div
        ref={sentinelRef}
        className="flex min-h-6 items-center justify-center px-2"
      >
        {isLoadingMore && <LoadingCircle size={17} aria-label="正在加载更多" />}
        {error && (
          <button
            type="button"
            onClick={onRetry}
            className="text-xs text-stone-500 underline-offset-2 hover:underline"
          >
            加载失败，点击重试
          </button>
        )}
        {!hasMore && !error && (
          <span className="text-[10px] tracking-wide text-stone-300">
            已显示全部
          </span>
        )}
      </div>
    </div>
  );
}
