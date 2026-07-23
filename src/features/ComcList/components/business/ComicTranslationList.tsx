import { useRef, useState, useEffect, useCallback } from "react";
import clsx from "clsx";
import { LoaderCircle } from "lucide-react";
import ComicTranslationCard from "@/features/ComicCard/components/business/ComicTranslationCard";
import { useToastStore } from "@/components/ui/NotificationToast/hooks";
import type { ComicTranslationListItem } from "../../types/types";

type Props = {
  onLoadComics: (
    offset: number,
    limit: number,
  ) => Promise<ComicTranslationListItem[] | string>;
  onComicClick?: (comicInfo: ComicTranslationListItem["comicInfo"]) => void;
};

export default function ComicTranslationList({
  onLoadComics,
  onComicClick,
}: Props) {
  const pageSize = 12;
  const [comics, setComics] = useState<ComicTranslationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const isLoadingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const offsetRef = useRef(0);
  const { showToast } = useToastStore();

  const loadComics = useCallback(async (reset = false) => {
    if (isLoadingRef.current) return;
    if (!reset && !hasMoreRef.current) return;

    if (reset) {
      hasMoreRef.current = true;
      offsetRef.current = 0;
      setComics([]);
      setHasMore(true);
    }

    const requestOffset = reset ? 0 : offsetRef.current;

    isLoadingRef.current = true;
    setIsLoading(true);

    try {
      const result = await onLoadComics(requestOffset, pageSize);
      if (typeof result === "string") {
        console.error("[ComicTranslationList] 加载漫画列表失败:", result);
        showToast(result, "error");
        hasMoreRef.current = false;
        setHasMore(false);
        return;
      }

      const nextOffset = requestOffset + result.length;
      const nextHasMore = result.length === pageSize;

      offsetRef.current = nextOffset;
      hasMoreRef.current = nextHasMore;
      setHasMore(nextHasMore);
      setComics((prev) => (reset ? result : [...prev, ...result]));
    } catch (err) {
      console.error("[ComicTranslationList] 加载漫画列表异常:", err);
      showToast("发生未知错误", "error");
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [onLoadComics, pageSize, showToast]);

  // 保持最新的 loadComics 引用，供 post-load check 使用
  const loadComicsRef = useRef(loadComics);
  useEffect(() => {
    loadComicsRef.current = loadComics;
  });

  useEffect(() => {
    isLoadingRef.current = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadComics(true);
  }, [loadComics]);

  // 每次加载完成后，检查 loadMoreRef 是否仍在可视区。
  // 如果仍在可视区（列表没撑满视口）且 hasMore 为 true，则继续加载。
  // 这解决了 observer 在 isLoading=true 时触发被忽略、之后不再触发的竞态问题。
  const prevIsLoadingRef = useRef(isLoading);
  useEffect(() => {
    const wasLoading = prevIsLoadingRef.current;
    prevIsLoadingRef.current = isLoading;

    if (!wasLoading || isLoading) return;
    if (!hasMoreRef.current) return;
    if (!loadMoreRef.current || !scrollContainerRef.current) return;

    const containerRect = scrollContainerRef.current.getBoundingClientRect();
    const targetRect = loadMoreRef.current.getBoundingClientRect();

    if (targetRect.top < containerRect.bottom) {
      loadComicsRef.current();
    }
  }, [isLoading]);

  useEffect(() => {
    if (!loadMoreRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (firstEntry && firstEntry.isIntersecting) {
          void loadComics();
        }
      },
      { root: scrollContainerRef.current },
    );
    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [loadComics]);

  return (
    <div
      className={clsx("w-full h-full min-h-0 flex flex-col overflow-hidden")}
    >
      <div
        ref={scrollContainerRef}
        className={clsx("flex-1 min-h-0 overflow-y-auto overflow-x-hidden")}
      >
        <div
          className={clsx(
            "grid w-full grid-cols-1 items-start justify-start gap-4",
            "px-2 py-1 md:grid-cols-2 xl:grid-cols-3",
          )}
        >
          {comics.map(({ comicInfo, chapter }) => (
            <ComicTranslationCard
              key={`${comicInfo.id}:${chapter?.id ?? "pinned"}`}
              comicInfo={comicInfo}
              chapter={chapter}
              onClick={() => onComicClick?.(comicInfo)}
            />
          ))}
        </div>

        <div
          ref={loadMoreRef}
          className={clsx("flex h-16 w-full items-center justify-center py-4")}
        >
          {isLoading && (
            <LoaderCircle className={clsx("h-5 w-5 animate-spin text-stone-300")} />
          )}
          {!hasMore && comics.length > 0 && (
            <span className={clsx("text-slate-400 text-sm")}>
              没有更多漫画了 O^O
            </span>
          )}
          {!hasMore && comics.length === 0 && !isLoading && (
            <span className={clsx("text-slate-400 text-sm")}>暂无漫画 o.O</span>
          )}
        </div>
      </div>
    </div>
  );
}
