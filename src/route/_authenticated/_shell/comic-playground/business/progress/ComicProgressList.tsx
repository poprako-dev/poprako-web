import { type JSX, useRef } from "react";
import clsx from "clsx";
import { LoaderCircle } from "lucide-react";
import type { ComicInfo } from "@/route/_authenticated/business/comic/comic";
import type { Result } from "@/shared/utility/result";
import { ComicProgressItem } from "@/route/_authenticated/_shell/comic-playground/business/progress/ComicProgressItem";
import { useComicProgressList } from "@/route/_authenticated/_shell/comic-playground/business/progress/use-comic-progress-list";
import { useComicProgressPagination } from "@/route/_authenticated/_shell/comic-playground/business/progress/use-comic-progress-pagination";

type Props = {
  onLoadComics: (offset: number, limit: number) => Promise<Result<ComicInfo[]>>;
  onComicClick: (comicInfo: ComicInfo) => void;
};

export function ComicProgressList({ onLoadComics, onComicClick }: Props): JSX.Element {
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const { comics, isLoading, hasMore, loadComics, loadComicsRef } =
    useComicProgressList(onLoadComics);
  useComicProgressPagination({
    loadComics,
    loadComicsRef,
    loadMoreRef,
    scrollContainerRef,
    isLoading,
    hasMore,
  });

  return (
    <div
      ref={scrollContainerRef}
      className="w-full h-full min-h-0 overflow-y-auto overflow-x-hidden"
    >
      <div className={clsx("flex w-full flex-col gap-1.5 px-2 py-1")}>
        {comics.map((comic) => (
          <ComicProgressItem
            key={comic.id}
            comicInfo={comic}
            mode="reviewer"
            onClick={() => {
              onComicClick(comic);
            }}
          />
        ))}
      </div>
      <div ref={loadMoreRef} className="w-full flex justify-center py-4 h-16 items-center">
        {isLoading && <LoaderCircle className="h-5 w-5 text-icon-muted-warm animate-spin" />}
        {!hasMore && comics.length > 0 && (
          <span className="text-text-muted-cool text-sm">没有更多漫画了 O^O</span>
        )}
        {!hasMore && comics.length === 0 && !isLoading && (
          <span className="text-text-muted-cool text-sm">暂无漫画</span>
        )}
      </div>
    </div>
  );
}
