import { useRef, useState, useEffect, useCallback } from "react";
import clsx from "clsx";
import { LoaderCircle } from "lucide-react";
import type { ComicInfo } from "@/types";
import type { AssignmentInfo } from "@/types/assignment";
import type { Result } from "@/types/utils/result";
import { useToastStore } from "@/components/ui/NotificationToast/hooks";
import ComicProgressItem from "./ComicProgressItem";

type Props = {
  onLoadComics: (offset: number, limit: number) => Promise<ComicInfo[] | string>;
  onLoadAssignments: (
    comicInfo: ComicInfo,
  ) => Promise<Result<AssignmentInfo[]>>;
  onComicClick: (comicInfo: ComicInfo) => void;
};

export default function ComicProgressList({
  onLoadComics,
  onLoadAssignments,
  onComicClick,
}: Props) {
  const pageSize = 20;
  const { showToast } = useToastStore();
  const [comics, setComics] = useState<ComicInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const isLoadingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const offsetRef = useRef(0);

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
        console.error("[ComicProgressList] 加载漫画列表失败:", result);
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
      console.error("[ComicProgressList] 加载漫画列表异常:", err);
      showToast("发生未知错误", "error");
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [onLoadComics, pageSize, showToast]);

  useEffect(() => {
    isLoadingRef.current = false;
    const timerId = window.setTimeout(() => {
      void loadComics(true);
    }, 0);

    return () => {
      window.clearTimeout(timerId);
    };
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
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [loadComics]);

  return (
    <div
      ref={scrollContainerRef}
      className="w-full h-full min-h-0 overflow-y-auto overflow-x-hidden"
    >
      <div
        className={clsx(
          "flex w-full flex-col gap-1.5 px-2 py-1",
        )}
      >
        {comics.map((comic) => (
          <ComicProgressItem
            key={comic.id}
            comicInfo={comic}
            mode="reviewer"
            onLoadAssignments={onLoadAssignments}
            onClick={() => onComicClick(comic)}
          />
        ))}
      </div>

      <div
        ref={loadMoreRef}
        className="w-full flex justify-center py-4 h-16 items-center"
      >
        {isLoading && (
          <LoaderCircle className="h-5 w-5 text-stone-300 animate-spin" />
        )}
        {!hasMore && comics.length > 0 && (
          <span className="text-slate-400 text-sm">没有更多漫画了 O^O</span>
        )}
        {!hasMore && comics.length === 0 && !isLoading && (
          <span className="text-slate-400 text-sm">暂无漫画</span>
        )}
      </div>
    </div>
  );
}
