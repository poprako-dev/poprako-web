import { useRef, useState, useEffect, useCallback } from "react";
import clsx from "clsx";
import { LoaderCircle } from "lucide-react";
import type { ChapterInfo, ComicInfo } from "@/types";
import type { Result } from "@/types/utils/result";
import ComicTranslationCard from "@/features/ComicCard/components/business/ComicTranslationCard";
import { useToastStore } from "@/components/ui/NotificationToast/hooks";

type Props = {
  // 分页加载漫画列表，错误时返回字符串
  onLoadComics: (
    offset: number,
    limit: number,
  ) => Promise<ComicInfo[] | string>;
  onLoadLatestChapter: (
    comicInfo: ComicInfo,
  ) => Promise<Result<ChapterInfo | null>>;
  onComicClick?: (comicInfo: ComicInfo) => void;
};

// 内嵌式漫画列表（translator 模式），由父组件注入 onLoadComics 决定数据范围
// 使用 IntersectionObserver 实现无限下滑加载
export default function ComicTranslationList({
  onLoadComics,
  onLoadLatestChapter,
  onComicClick,
}: Props) {
  const [comics, setComics] = useState<ComicInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const { showToast } = useToastStore();

  const loadComics = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    try {
      const result = await onLoadComics(offset, 12);
      if (typeof result === "string") {
        console.error("[EmbeddedComicList] 加载漫画列表失败:", result);
        showToast(result, "error");
        setHasMore(false);
      } else {
        if (result.length < 12) {
          setHasMore(false);
        }
        setComics((prev) => [...prev, ...result]);
        setOffset((prev) => prev + result.length);
      }
    } catch (err) {
      console.error("[EmbeddedComicList] 加载漫画列表异常:", err);
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
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadComics]);

  return (
    <div
      className={clsx("w-full h-full min-h-0 flex flex-col overflow-hidden")}
    >
      {/* 漫画卡片列表 */}
      <div
        ref={scrollContainerRef}
        className={clsx("flex-1 min-h-0 overflow-y-auto overflow-x-hidden")}
      >
        <div
          className={clsx(
            "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
            "py-1 px-2",
            "gap-4 w-full justify-start items-start",
          )}
        >
          {comics.map((comic) => (
            <ComicTranslationCard
              key={comic.id}
              comicInfo={comic}
              onClick={() => onComicClick?.(comic)}
              onLoadPinnedChapter={onLoadLatestChapter}
            />
          ))}
        </div>

        {/* 无限滚动触发器 */}
        <div
          ref={loadMoreRef}
          className={clsx("w-full flex justify-center py-4 h-16 items-center")}
        >
          {isLoading && (
            <LoaderCircle
              className={clsx("h-8 w-8 text-blue-300 animate-spin")}
            />
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
