import { useRef, useState, useEffect, useCallback } from "react";
import clsx from "clsx";
import { LoaderCircle } from "lucide-react";
import type { ComicInfo, ChapterInfo } from "@/types";
import type { AssignmentInfo } from "@/types/assignment";
import type { Result } from "@/types/utils/result";
import { useToastStore } from "@/components/ui/NotificationToast/hooks";
import ComicProgressItem from "./ComicProgressItem";

type Props = {
  onLoadComics: (offset: number, limit: number) => Promise<ComicInfo[] | string>;
  onLoadPinnedChapter: (
    comicInfo: ComicInfo,
  ) => Promise<Result<ChapterInfo | null>>;
  onLoadAssignments: (
    comicInfo: ComicInfo,
  ) => Promise<Result<AssignmentInfo[]>>;
  onComicClick: (comicInfo: ComicInfo) => void;
};

export default function ComicProgressList({
  onLoadComics,
  onLoadPinnedChapter,
  onLoadAssignments,
  onComicClick,
}: Props) {
  const { showToast } = useToastStore();
  const [comics, setComics] = useState<ComicInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const loadComics = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    try {
      const result = await onLoadComics(offset, 20);
      if (typeof result === "string") {
        console.error("[ComicProgressList] 加载漫画列表失败:", result);
        showToast(result, "error");
        setHasMore(false);
      } else {
        if (result.length < 20) setHasMore(false);
        setComics((prev) => [...prev, ...result]);
        setOffset((prev) => prev + result.length);
      }
    } catch (err) {
      console.error("[ComicProgressList] 加载漫画列表异常:", err);
      showToast("发生未知错误", "error");
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, offset, onLoadComics, showToast]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setComics([]);
    setHasMore(true);
    setOffset(0);
    setIsLoading(false);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [onLoadComics]);

  useEffect(() => {
    if (!loadMoreRef.current) return;
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (firstEntry && firstEntry.isIntersecting) {
          loadComics();
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
          "flex flex-col gap-1.5 py-1 px-2 w-full",
        )}
      >
        {comics.map((comic) => (
          <ComicProgressItem
            key={comic.id}
            comicInfo={comic}
            mode="reviewer"
            onLoadPinnedChapter={onLoadPinnedChapter}
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
