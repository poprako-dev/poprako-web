import { useEffect, useRef } from "react";
import type { RefObject } from "react";

type Loader = (shouldReset?: boolean) => Promise<void>;
type Args = {
  loadComics: Loader;
  loadComicsRef: RefObject<Loader>;
  loadMoreRef: RefObject<HTMLDivElement | null>;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  isLoading: boolean;
  hasMore: boolean;
};
type RefillArgs = Pick<Args, "loadComicsRef" | "loadMoreRef" | "scrollContainerRef">;

export function useComicProgressPagination(args: Args): void {
  useVisibleContainerRefill(args);
  useIntersectionPagination(args);
}

function useVisibleContainerRefill(args: Args): void {
  const { hasMore, isLoading, loadComicsRef, loadMoreRef, scrollContainerRef } = args;
  const previousLoadingRef = useRef(isLoading);
  useEffect(() => {
    const wasLoading = previousLoadingRef.current;
    previousLoadingRef.current = isLoading;
    if (!wasLoading || isLoading || !hasMore) return;
    refillVisiblePage({ loadComicsRef, loadMoreRef, scrollContainerRef });
  }, [hasMore, isLoading, loadComicsRef, loadMoreRef, scrollContainerRef]);
}

function refillVisiblePage(args: RefillArgs): void {
  if (!args.loadMoreRef.current || !args.scrollContainerRef.current) return;
  const containerRect = args.scrollContainerRef.current.getBoundingClientRect();
  const targetRect = args.loadMoreRef.current.getBoundingClientRect();
  if (targetRect.top < containerRect.bottom) {
    void args.loadComicsRef.current();
  }
}

function useIntersectionPagination(args: Args): void {
  const { loadComics, loadMoreRef, scrollContainerRef } = args;
  useEffect(() => {
    if (!loadMoreRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadComics();
        }
      },
      { root: scrollContainerRef.current },
    );
    observer.observe(loadMoreRef.current);
    return () => {
      observer.disconnect();
    };
  }, [loadComics, loadMoreRef, scrollContainerRef]);
}
