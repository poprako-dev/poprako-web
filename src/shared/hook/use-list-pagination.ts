import { useEffect, type RefObject } from "react";

type Options = {
  loadMore: () => Promise<void>;
  isLoading: boolean;
  hasMore: boolean;
  error: string | null;
  enabled?: boolean | undefined;
  containerRef: RefObject<HTMLDivElement | null>;
  sentinelRef: RefObject<HTMLDivElement | null>;
};

export function useListPagination({
  loadMore,
  isLoading,
  hasMore,
  error,
  enabled = true,
  containerRef,
  sentinelRef,
}: Options): void {
  useEffect(() => {
    const container = containerRef.current;
    const sentinel = sentinelRef.current;
    if (!enabled || !container || !sentinel || isLoading || !hasMore || error !== null) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && container.getBoundingClientRect().height > 0) {
          void loadMore();
        }
      },
      { root: container },
    );
    observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, [loadMore, isLoading, hasMore, error, enabled, containerRef, sentinelRef]);
}
