import { useRef } from "react";
import type { ReactElement } from "react";
import clsx from "clsx";
import { LoaderCircle } from "lucide-react";
import { ComicTranslationCard } from "@/route/_authenticated/_shell/business/comic-list/ComicTranslationCard";
import type { Result } from "@/shared/utility/result";
import type { ComicTranslationListItem } from "@/route/_authenticated/_shell/business/comic-list/comic-list";
import { useComicTranslationList } from "@/route/_authenticated/_shell/business/comic-list/use-comic-translation-list";
import { useComicTranslationPagination } from "@/route/_authenticated/_shell/business/comic-list/use-comic-translation-pagination";

type Props = {
  onLoadComics: (offset: number, limit: number) => Promise<Result<ComicTranslationListItem[]>>;
  onComicClick: (comicId: string, chapterId?: string | null) => void;
};

export function ComicTranslationList({ onLoadComics, onComicClick }: Props): ReactElement {
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const { comics, isLoading, hasMore, loadComics, loadComicsRef, prevIsLoadingRef, hasMoreRef } =
    useComicTranslationList(onLoadComics);
  useComicTranslationPagination({
    loadComics,
    loadComicsRef,
    loadMoreRef,
    scrollContainerRef,
    isLoading,
    prevIsLoadingRef,
    hasMoreRef,
  });

  return (
    <div className={clsx("w-full h-full min-h-0 flex flex-col overflow-hidden")}>
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
              onClick={() => {
                onComicClick(comicInfo.id, chapter?.id);
              }}
            />
          ))}
        </div>

        <div
          ref={loadMoreRef}
          className={clsx("flex h-16 w-full items-center justify-center py-4")}
        >
          {isLoading && (
            <LoaderCircle className={clsx("h-5 w-5 animate-spin text-icon-muted-warm")} />
          )}
          {!hasMore && comics.length > 0 && (
            <span className={clsx("text-text-muted-cool text-sm")}>没有更多漫画了 O^O</span>
          )}
          {!hasMore && comics.length === 0 && !isLoading && (
            <span className={clsx("text-text-muted-cool text-sm")}>暂无漫画 o.O</span>
          )}
        </div>
      </div>
    </div>
  );
}
