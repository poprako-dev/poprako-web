import { useRef, useState, useEffect, useCallback } from "react";
import clsx from "clsx";
import { LoaderCircle } from "lucide-react";
import type { ComicInfo } from "@/types";
import ComicTranslationCard from "@/features/ComicCard/components/business/ComicTranslationCard";
import { useToastStore } from "@/components/ui/NotificationToast/hooks";

type Props = {
  onLoadComics: (
    offset: number,
    limit: number,
  ) => Promise<ComicInfo[] | string>;
  onComicClick?: (comicInfo: ComicInfo) => void;
};

export default function ComicTranslationList({
  onLoadComics,
  onComicClick,
}: Props) {
  const pageSize = 12;
  const [comics, setComics] = useState<ComicInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
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

  useEffect(() => {
    isLoadingRef.current = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadComics(true);
  }, [loadComics]);

  useEffect(() => {
    if (!loadMoreRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (firstEntry && firstEntry.isIntersecting) {
          void loadComics();
        }
      },
      { root: scrollContainerRef.current },
    );
    observerRef.current.observe(loadMoreRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
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
          {comics.map((comic) => (
            <ComicTranslationCard
              key={comic.id}
              comicInfo={comic}
              onClick={() => onComicClick?.(comic)}
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