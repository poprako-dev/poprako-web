import { useCallback, useEffect, useLayoutEffect, useReducer, useRef } from "react";
import type { Result } from "@/types/utils/result";
import {
  initialPaginationState,
  paginationReducer,
} from "./pagination";

type Options<T extends { id: string }> = {
  enabled: boolean;
  queryKey: string;
  pageSize: number;
  loadPage: (offset: number, limit: number) => Promise<Result<T[]>>;
  onError: (error: string) => void;
};

export function usePaginatedList<T extends { id: string }>({
  enabled,
  queryKey,
  pageSize,
  loadPage,
  onError,
}: Options<T>) {
  const [state, dispatch] = useReducer(
    paginationReducer<T>,
    undefined,
    initialPaginationState<T>,
  );
  const stateRef = useRef(state);
  const loadPageRef = useRef(loadPage);
  const onErrorRef = useRef(onError);
  const requestVersionRef = useRef(0);
  const activeRequestRef = useRef<number | null>(null);
  const loadedQueryKeyRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    stateRef.current = state;
    loadPageRef.current = loadPage;
    onErrorRef.current = onError;
  });

  const execute = useCallback(async (
    requestVersion: number,
    offset: number,
    append: boolean,
  ) => {
    activeRequestRef.current = requestVersion;
    const result = await loadPageRef.current(offset, pageSize);

    if (requestVersion !== requestVersionRef.current) return;
    activeRequestRef.current = null;

    if (!result.success) {
      dispatch({
        type: "reject",
        requestVersion,
        error: result.error,
      });
      onErrorRef.current(result.error);
      return;
    }

    dispatch({
      type: "resolve",
      requestVersion,
      items: result.data,
      pageSize,
      append,
    });
  }, [pageSize]);

  const reload = useCallback(() => {
    if (!enabled) return;

    const requestVersion = requestVersionRef.current + 1;
    requestVersionRef.current = requestVersion;
    loadedQueryKeyRef.current = queryKey;
    dispatch({ type: "reset", requestVersion });
    void execute(requestVersion, 0, false);
  }, [enabled, execute, queryKey]);

  const loadMore = useCallback(() => {
    if (!enabled || activeRequestRef.current !== null) return;

    const snapshot = stateRef.current;
    if (
      !snapshot.hasMore ||
      snapshot.error ||
      snapshot.phase === "initial-loading"
    ) return;

    const requestVersion = requestVersionRef.current;
    dispatch({ type: "load-more", requestVersion });
    void execute(requestVersion, snapshot.offset, true);
  }, [enabled, execute]);

  const retry = useCallback(() => {
    const snapshot = stateRef.current;
    if (snapshot.items.length === 0) {
      reload();
      return;
    }
    if (!enabled || activeRequestRef.current !== null) return;

    const requestVersion = requestVersionRef.current;
    dispatch({ type: "load-more", requestVersion });
    void execute(requestVersion, snapshot.offset, true);
  }, [enabled, execute, reload]);

  useEffect(() => {
    if (!enabled || loadedQueryKeyRef.current === queryKey) return;
    reload();
  }, [enabled, queryKey, reload]);

  useEffect(() => {
    return () => {
      requestVersionRef.current += 1;
      activeRequestRef.current = null;
    };
  }, []);

  return {
    ...state,
    isInitialLoading: state.phase === "initial-loading",
    isLoadingMore: state.phase === "loading-more",
    reload,
    loadMore,
    retry,
  };
}
