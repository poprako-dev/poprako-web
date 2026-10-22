import { useRef } from "react";
import type { ReactElement } from "react";
import clsx from "clsx";
import { LoaderCircle } from "lucide-react";
import { ComicTranslationCard } from "@/route/_authenticated/_shell/business/comic-list/ComicTranslationCard";
import type { ComicTranslationListState } from "./use-comic-translation-list";
import { useListPagination } from "@/shared/hook/use-list-pagination";
import { Button } from "@/shared/component/Button";

type Props = {
  state: ComicTranslationListState;
  enabled?: boolean | undefined;
  onComicClick: (comicId: string, chapterId?: string | null) => void;
};

export function ComicTranslationListView({ state, onComicClick, enabled }: Props): ReactElement {
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const { items: comics, isLoading, hasMore, error, retry } = state;
  useListPagination({
    ...state,
    enabled,
    sentinelRef: loadMoreRef,
    containerRef: scrollContainerRef,
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
          {error !== null && (
            <div className="flex items-center gap-2">
              <p role="alert" className="text-sm text-muted-foreground">
                {error}
              </p>
              <Button onClick={() => void retry()}>重试</Button>
            </div>
          )}
          {!hasMore && error === null && comics.length > 0 && (
            <span className={clsx("text-text-muted-cool text-sm")}>没有更多漫画了 O^O</span>
          )}
          {!hasMore && error === null && comics.length === 0 && !isLoading && (
            <span className={clsx("text-text-muted-cool text-sm")}>暂无漫画 o.O</span>
          )}
        </div>
      </div>
    </div>
  );
}
