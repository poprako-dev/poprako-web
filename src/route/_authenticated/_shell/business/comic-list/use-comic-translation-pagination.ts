import { type RefObject, useEffect } from "react";

type PaginationRefs = {
  loadComics: (shouldReset?: boolean) => Promise<void>;
  loadComicsRef: { current: (shouldReset?: boolean) => Promise<void> };
  loadMoreRef: RefObject<HTMLDivElement | null>;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  isLoading: boolean;
  prevIsLoadingRef: { current: boolean };
  hasMoreRef: { current: boolean };
};

function checkVisibleLoadMore(args: PaginationRefs): void {
  const wasLoading = args.prevIsLoadingRef.current;
  args.prevIsLoadingRef.current = args.isLoading;
  if (!wasLoading || args.isLoading || !args.hasMoreRef.current) {
    return;
  }
  const container = args.scrollContainerRef.current;
  const target = args.loadMoreRef.current;
  if (!container || !target) {
    return;
  }
  if (target.getBoundingClientRect().top < container.getBoundingClientRect().bottom) {
    void args.loadComicsRef.current();
  }
}

function observeLoadMore(args: PaginationRefs): () => void {
  const target = args.loadMoreRef.current;
  if (!target) {
    return () => undefined;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) {
        void args.loadComics();
      }
    },
    { root: args.scrollContainerRef.current },
  );
  observer.observe(target);
  return () => {
    observer.disconnect();
  };
}

function useVisibleLoadMore(args: PaginationRefs): void {
  const {
    isLoading,
    loadComics,
    loadComicsRef,
    loadMoreRef,
    scrollContainerRef,
    prevIsLoadingRef,
    hasMoreRef,
  } = args;
  useEffect(() => {
    checkVisibleLoadMore({
      isLoading,
      loadComics,
      loadComicsRef,
      loadMoreRef,
      scrollContainerRef,
      prevIsLoadingRef,
      hasMoreRef,
    });
  }, [
    isLoading,
    loadComics,
    loadComicsRef,
    loadMoreRef,
    scrollContainerRef,
    prevIsLoadingRef,
    hasMoreRef,
  ]);
}

function useObserveLoadMore(args: PaginationRefs): void {
  const {
    isLoading,
    loadComics,
    loadComicsRef,
    loadMoreRef,
    scrollContainerRef,
    prevIsLoadingRef,
    hasMoreRef,
  } = args;
  useEffect(
    () =>
      observeLoadMore({
        isLoading,
        loadComics,
        loadComicsRef,
        loadMoreRef,
        scrollContainerRef,
        prevIsLoadingRef,
        hasMoreRef,
      }),
    [
      hasMoreRef,
      isLoading,
      loadComics,
      loadComicsRef,
      loadMoreRef,
      prevIsLoadingRef,
      scrollContainerRef,
    ],
  );
}

export function useComicTranslationPagination(args: {
  loadComics: (shouldReset?: boolean) => Promise<void>;
  loadComicsRef: { current: (shouldReset?: boolean) => Promise<void> };
  loadMoreRef: RefObject<HTMLDivElement | null>;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  isLoading: boolean;
  prevIsLoadingRef: { current: boolean };
  hasMoreRef: { current: boolean };
}): void {
  // 每次加载完成后，检查 loadMoreRef 是否仍在可视区。
  // 如果仍在可视区（列表没撑满视口）且 hasMore 为 true，则继续加载。
  // 这解决了 observer 在 isLoading=true 时触发被忽略、之后不再触发的竞态问题。
  useVisibleLoadMore(args);
  useObserveLoadMore(args);
}
