import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import { showLocalApiFailure, showLocalCaughtError } from "@/route/business/request-error";
import type { Result } from "@/shared/utility/result";
import type { ComicTranslationListItem } from "@/route/_authenticated/_shell/business/comic-list/comic-list";

type LoadComics = (offset: number, limit: number) => Promise<Result<ComicTranslationListItem[]>>;
type ComicTranslationListState = {
  comics: ComicTranslationListItem[];
  isLoading: boolean;
  hasMore: boolean;
  loadComics: (shouldReset?: boolean) => Promise<void>;
  loadComicsRef: { current: (shouldReset?: boolean) => Promise<void> };
  prevIsLoadingRef: { current: boolean };
  hasMoreRef: { current: boolean };
};

async function fetchComicPage(args: {
  shouldReset: boolean;
  onLoadComics: LoadComics;
  isLoadingRef: { current: boolean };
  hasMoreRef: { current: boolean };
  offsetRef: { current: number };
  pageSize: number;
  setComics: Dispatch<SetStateAction<ComicTranslationListItem[]>>;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  setHasMore: Dispatch<SetStateAction<boolean>>;
  showToast: ReturnType<typeof useToastStore.getState>["showToast"];
}): Promise<void> {
  if (args.isLoadingRef.current || (!args.shouldReset && !args.hasMoreRef.current)) {
    return;
  }
  if (args.shouldReset) {
    args.hasMoreRef.current = true;
    args.offsetRef.current = 0;
    args.setComics([]);
    args.setHasMore(true);
  }
  const requestOffset = args.shouldReset ? 0 : args.offsetRef.current;
  args.isLoadingRef.current = true;
  args.setIsLoading(true);
  try {
    const result = await args.onLoadComics(requestOffset, args.pageSize);
    if (!result.success) {
      console.error("[ComicTranslationList] 加载漫画列表失败:", result.error);
      showLocalApiFailure(result, args.showToast);
      args.hasMoreRef.current = false;
      args.setHasMore(false);
      return;
    }
    const items = result.data;
    const nextOffset = requestOffset + items.length;
    const isNextHasMore = items.length === args.pageSize;
    args.offsetRef.current = nextOffset;
    args.hasMoreRef.current = isNextHasMore;
    args.setHasMore(isNextHasMore);
    args.setComics((previous) => (args.shouldReset ? items : [...previous, ...items]));
  } catch (error) {
    console.error("[ComicTranslationList] 加载漫画列表异常:", error);
    showLocalCaughtError(error, args.showToast, "发生未知错误");
  } finally {
    args.isLoadingRef.current = false;
    args.setIsLoading(false);
  }
}

export function useComicTranslationList(onLoadComics: LoadComics): ComicTranslationListState {
  const pageSize = 12;
  const { showToast } = useToastStore();
  const [comics, setComics] = useState<ComicTranslationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const isLoadingRef = useRef(false);
  const prevIsLoadingRef = useRef(isLoading);
  const hasMoreRef = useRef(true);
  const offsetRef = useRef(0);
  const loadComics = useCallback(
    (shouldReset = false) =>
      fetchComicPage({
        shouldReset,
        onLoadComics,
        isLoadingRef,
        hasMoreRef,
        offsetRef,
        pageSize,
        setComics,
        setIsLoading,
        setHasMore,
        showToast,
      }),
    [onLoadComics, pageSize, showToast],
  );
  const loadComicsRef = useRef(loadComics);
  // 保持最新的 loadComics 引用，供 post-load check 使用
  useEffect(() => {
    loadComicsRef.current = loadComics;
  });
  useEffect(() => {
    isLoadingRef.current = false;

    void loadComics(true);
  }, [loadComics]);
  return {
    comics,
    isLoading,
    hasMore,
    loadComics,
    loadComicsRef,
    prevIsLoadingRef,
    hasMoreRef,
  };
}
