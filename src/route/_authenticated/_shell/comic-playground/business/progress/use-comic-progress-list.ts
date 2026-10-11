import { useCallback, useEffect, useRef, useState } from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";
import type { ComicInfo } from "@/route/_authenticated/business/comic/comic";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import { showLocalApiFailure, showLocalCaughtError } from "@/route/business/request-error";
import type { Result } from "@/shared/utility/result";
import type { ToastType } from "@/shared/component/notification-toast/notification-toast-type";

type Loader = (shouldReset?: boolean) => Promise<void>;
type ComicProgressListState = {
  comics: ComicInfo[];
  isLoading: boolean;
  hasMore: boolean;
  loadComics: Loader;
  loadComicsRef: RefObject<Loader>;
};
type Args = {
  onLoadComics: (offset: number, limit: number) => Promise<Result<ComicInfo[]>>;
  showToast: (message: string, type: ToastType) => void;
  setComics: Dispatch<SetStateAction<ComicInfo[]>>;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  setHasMore: Dispatch<SetStateAction<boolean>>;
  isLoadingRef: RefObject<boolean>;
  hasMoreRef: RefObject<boolean>;
  offsetRef: RefObject<number>;
};

const PAGE_SIZE = 20;

export function useComicProgressList(onLoadComics: Args["onLoadComics"]): ComicProgressListState {
  const { showToast } = useToastStore();
  const [comics, setComics] = useState<ComicInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const isLoadingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const offsetRef = useRef(0);
  const loadComics = useCallback(
    (shouldReset = false) => {
      return requestComicPage(
        {
          onLoadComics,
          showToast,
          setComics,
          setIsLoading,
          setHasMore,
          isLoadingRef,
          hasMoreRef,
          offsetRef,
        },
        shouldReset,
      );
    },
    [onLoadComics, showToast],
  );
  const loadComicsRef = useRef(loadComics);
  useEffect(() => {
    loadComicsRef.current = loadComics;
  }, [loadComics]);
  useInitialComicPage(loadComics, isLoadingRef);
  return { comics, isLoading, hasMore, loadComics, loadComicsRef };
}

function useInitialComicPage(loadComics: Loader, isLoadingRef: RefObject<boolean>): void {
  useEffect(() => {
    isLoadingRef.current = false;
    const timerId = setTimeout(() => void loadComics(true), 0);
    return () => {
      clearTimeout(timerId);
    };
  }, [isLoadingRef, loadComics]);
}

async function requestComicPage(args: Args, shouldReset: boolean): Promise<void> {
  if (args.isLoadingRef.current || (!shouldReset && !args.hasMoreRef.current)) return;
  if (shouldReset) resetComicPage(args);
  const requestOffset = shouldReset ? 0 : args.offsetRef.current;
  args.isLoadingRef.current = true;
  args.setIsLoading(true);
  await fetchComicPage(args, requestOffset, shouldReset);
}

function resetComicPage(args: Args): void {
  args.hasMoreRef.current = true;
  args.offsetRef.current = 0;
  args.setComics([]);
  args.setHasMore(true);
}

async function fetchComicPage(
  args: Args,
  requestOffset: number,
  shouldReset: boolean,
): Promise<void> {
  try {
    const result = await args.onLoadComics(requestOffset, PAGE_SIZE);
    if (!result.success) {
      handleComicPageFailure(args, result);
      return;
    }
    updateComicPage(args, result.data, requestOffset, shouldReset);
  } catch (error) {
    console.error("[ComicProgressList] 加载漫画列表异常:", error);
    showLocalCaughtError(error, args.showToast, "发生未知错误");
  } finally {
    args.isLoadingRef.current = false;
    args.setIsLoading(false);
  }
}

function handleComicPageFailure(
  args: Args,
  result: Extract<Result<ComicInfo[]>, { success: false }>,
): void {
  console.error("[ComicProgressList] 加载漫画列表失败:", result.error);
  showLocalApiFailure(result, args.showToast);
  args.hasMoreRef.current = false;
  args.setHasMore(false);
}

function updateComicPage(
  args: Args,
  items: ComicInfo[],
  requestOffset: number,
  shouldReset: boolean,
): void {
  const nextOffset = requestOffset + items.length;
  const nextHasMore = items.length === PAGE_SIZE;
  args.offsetRef.current = nextOffset;
  args.hasMoreRef.current = nextHasMore;
  args.setHasMore(nextHasMore);
  args.setComics((previous) => (shouldReset ? items : [...previous, ...items]));
}
