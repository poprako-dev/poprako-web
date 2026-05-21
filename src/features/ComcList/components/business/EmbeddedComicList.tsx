import { useRef, useState, useEffect, useCallback } from "react";
import clsx from "clsx";
import { PencilLine, Eye, LoaderCircle } from "lucide-react";
import type { ChapterInfo, ComicInfo } from "@/types";
import type { AssignmentInfo } from "@/types/assignment";
import type { Result } from "@/types/utils/result";
import type { ViewMode } from "@/features/ComicCard/types/types";
import ComicCard from "@/features/ComicCard/components/business/ComicCard";
import { useToastStore } from "@/components/ui/NotificationToast/hooks";

type Props = {
  mode: ViewMode;
  // 分页加载漫画列表，错误时返回字符串
  onLoadComics: (
    offset: number,
    limit: number,
  ) => Promise<ComicInfo[] | string>;
  // 加载指定漫画的最新章节，供 ComicCard 展示进度信息
  onLoadLatestChapter: (
    comicInfo: ComicInfo,
  ) => Promise<Result<ChapterInfo | null>>;
  // 加载指定漫画的分工列表，reviewer 模式下使用
  onLoadAssignments?: (
    comicInfo: ComicInfo,
  ) => Promise<Result<AssignmentInfo[]>>;
  onComicClick?: (comicInfo: ComicInfo) => void;
};

// 内嵌式漫画列表，展示由父组件注入的 onLoadComics 所决定条件下的漫画卡片
// 使用 IntersectionObserver 实现无限下滑加载，支持 translator / reviewer 两种模式切换
export default function EmbeddedComicList({
  mode,
  onLoadComics,
  onLoadLatestChapter,
  onLoadAssignments,
  onComicClick,
}: Props) {
  const [currentMode, setCurrentMode] = useState<ViewMode>(mode);
  const [comics, setComics] = useState<ComicInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const { showToast } = useToastStore();

  const loadAssignments = useCallback(
    async (comicInfo: ComicInfo): Promise<Result<AssignmentInfo[]>> => {
      if (!onLoadAssignments) {
        return { success: true, data: [] };
      }
      return onLoadAssignments(comicInfo);
    },
    [onLoadAssignments],
  );

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

  const handleModeChange = (m: ViewMode) => {
    setCurrentMode(m);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentMode(mode);
  }, [mode]);

  return (
    <div
      className={clsx("w-full h-full min-h-0 flex flex-col overflow-hidden")}
    >
      {/* 顶部 mode 切换栏 */}
      <div className={clsx("flex items-center justify-between shrink-0 pb-4")}>
        <div className={clsx("flex-1 mr-4")} aria-hidden="true">
          <div
            className={clsx("w-full h-0.5 rounded-sm")}
            style={{
              background:
                "linear-gradient(90deg, rgba(148,163,184,1) 0%," +
                " rgba(148,163,184,0) 60%)",
            }}
          />
        </div>
        <div className={clsx("flex bg-slate-100 p-1 rounded-md")}>
          <button
            type="button"
            onClick={() => handleModeChange("translator")}
            className={clsx(
              "px-3 py-1.5 rounded-sm transition-colors flex items-center gap-2",
              currentMode === "translator"
                ? "bg-white shadow-sm text-slate-800 font-medium"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-200",
            )}
          >
            <PencilLine size={16} />
          </button>
          <button
            type="button"
            onClick={() => handleModeChange("reviewer")}
            className={clsx(
              "px-3 py-1.5 rounded-sm transition-colors flex items-center gap-2",
              currentMode === "reviewer"
                ? "bg-white shadow-sm text-slate-800 font-medium"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-200",
            )}
          >
            <Eye size={16} />
          </button>
        </div>
      </div>

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
            <ComicCard
              key={comic.id}
              comicInfo={comic}
              mode={currentMode}
              onClick={() => onComicClick?.(comic)}
              onLoadPinnedChapter={onLoadLatestChapter}
              onLoadAssignments={loadAssignments}
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
