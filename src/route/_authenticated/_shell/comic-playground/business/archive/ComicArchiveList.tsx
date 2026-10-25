import { useRef, type ReactElement } from "react";
import { LoaderCircle } from "lucide-react";
import type { ComicInfo } from "@/route/_authenticated/business/comic/comic";
import type { PageLoader } from "@/shared/hook/paged-list";
import { usePagedList } from "@/shared/hook/use-paged-list";
import { useListPagination } from "@/shared/hook/use-list-pagination";
import { useAppStore } from "@/route/business/session/session-store";
import { Button } from "@/shared/component/Button";
import { ComicArchiveItem } from "./ComicArchiveItem";

type Props = { onLoadComics: PageLoader<ComicInfo> };

export function ComicArchiveList({ onLoadComics }: Props): ReactElement {
  const generation = useAppStore((state) => state.generation);
  const state = usePagedList({ loader: onLoadComics, pageSize: 20, resetKey: generation });
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  useListPagination({ ...state, sentinelRef, containerRef });
  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="归档漫画列表"
      tabIndex={0}
      className="h-full min-h-0 w-full overflow-x-hidden overflow-y-auto"
    >
      <ul aria-label="归档漫画" className="flex w-full flex-col gap-1.5 px-2 py-1">
        {state.items.map((comic) => (
          <ComicArchiveItem key={comic.id} comic={comic} />
        ))}
      </ul>
      <div ref={sentinelRef} className="flex h-16 w-full items-center justify-center py-4">
        {state.isLoading && (
          <LoaderCircle
            className="h-5 w-5 animate-spin text-icon-muted-warm"
            aria-label="正在加载归档漫画"
          />
        )}
        {state.error !== null && (
          <div className="flex items-center gap-2">
            <p role="alert" className="text-sm text-muted-foreground">
              {state.error}
            </p>
            <Button variant="outline" onClick={() => void state.retry()}>
              重试
            </Button>
          </div>
        )}
        {!state.hasMore && state.error === null && !state.isLoading && (
          <span className="text-sm text-text-muted-cool">
            {state.items.length === 0 ? "暂无归档漫画" : "没有更多漫画了 O^O"}
          </span>
        )}
      </div>
    </div>
  );
}
