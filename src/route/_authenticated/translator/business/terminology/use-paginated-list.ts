import { useCallback, useEffect, useLayoutEffect, useReducer, useRef } from "react";
import type { Dispatch, RefObject } from "react";
import type { Result, ResultFailure } from "@/shared/utility/result";
import {
  initialPaginationState,
  paginationReducer,
} from "@/route/_authenticated/translator/business/terminology/pagination";
import type {
  PaginationAction,
  PaginationState,
} from "@/route/_authenticated/translator/business/terminology/pagination";

type Options<T extends { id: string }> = {
  enabled: boolean;
  queryKey: string;
  pageSize: number;
  loadPage: (offset: number, limit: number) => Promise<Result<T[]>>;
  onError: (error: ResultFailure) => void;
};

type PaginatedList<T extends { id: string }> = PaginationState<T> & {
  isInitialLoading: boolean;
  isLoadingMore: boolean;
  reload: () => void;
  loadMore: () => void;
  retry: () => void;
};
type PageExecutor = (version: number, offset: number, append: boolean) => Promise<void>;
interface PaginationActions {
  reload: () => void;
  loadMore: () => void;
  retry: () => void;
}

type RequestRuntime<T extends { id: string }> = {
  dispatch: Dispatch<PaginationAction<T>>;
  loadPageRef: RefObject<Options<T>["loadPage"]>;
  onErrorRef: RefObject<Options<T>["onError"]>;
  requestVersionRef: RefObject<number>;
  activeRequestRef: RefObject<number | null>;
  pageSize: number;
};

async function executePageRequest<T extends { id: string }>(
  requestVersion: number,
  offset: number,
  shouldAppend: boolean,
  runtime: RequestRuntime<T>,
): Promise<void> {
  runtime.activeRequestRef.current = requestVersion;
  const result = await runtime.loadPageRef.current(offset, runtime.pageSize);
  if (requestVersion !== runtime.requestVersionRef.current) return;
  runtime.activeRequestRef.current = null;
  if (!result.success) {
    runtime.dispatch({ type: "reject", requestVersion, error: result.error });
    runtime.onErrorRef.current(result);
    return;
  }
  runtime.dispatch({
    type: "resolve",
    requestVersion,
    items: result.data,
    pageSize: runtime.pageSize,
    shouldAppend,
  });
}

function requestReload<T extends { id: string }>(options: {
  enabled: boolean;
  queryKey: string;
  requestVersionRef: RefObject<number>;
  loadedQueryKeyRef: RefObject<string | null>;
  dispatch: Dispatch<PaginationAction<T>>;
  execute: PageExecutor;
}): void {
  if (!options.enabled) return;
  const requestVersion = options.requestVersionRef.current + 1;
  options.requestVersionRef.current = requestVersion;
  options.loadedQueryKeyRef.current = options.queryKey;
  options.dispatch({ type: "reset", requestVersion });
  void options.execute(requestVersion, 0, false);
}

function requestLoadMore<T extends { id: string }>(options: {
  enabled: boolean;
  stateRef: RefObject<PaginationState<T>>;
  requestVersionRef: RefObject<number>;
  activeRequestRef: RefObject<number | null>;
  dispatch: Dispatch<PaginationAction<T>>;
  execute: PageExecutor;
}): void {
  if (!options.enabled || options.activeRequestRef.current !== null) return;
  const snapshot = options.stateRef.current;
  if (!snapshot.hasMore || snapshot.error || snapshot.phase === "initial-loading") return;
  const requestVersion = options.requestVersionRef.current;
  options.dispatch({ type: "load-more", requestVersion });
  void options.execute(requestVersion, snapshot.offset, true);
}

function requestRetry<T extends { id: string }>(options: {
  enabled: boolean;
  stateRef: RefObject<PaginationState<T>>;
  requestVersionRef: RefObject<number>;
  activeRequestRef: RefObject<number | null>;
  dispatch: Dispatch<PaginationAction<T>>;
  execute: PageExecutor;
  reload: () => void;
}): void {
  const snapshot = options.stateRef.current;
  if (snapshot.items.length === 0) {
    options.reload();
    return;
  }
  requestLoadMore(options);
}

function usePageRequestExecutor<T extends { id: string }>(
  runtime: RequestRuntime<T>,
): PageExecutor {
  const { dispatch, loadPageRef, onErrorRef, requestVersionRef, activeRequestRef, pageSize } =
    runtime;
  return useCallback(
    (requestVersion: number, offset: number, shouldAppend: boolean) => {
      return executePageRequest(requestVersion, offset, shouldAppend, {
        dispatch,
        loadPageRef,
        onErrorRef,
        requestVersionRef,
        activeRequestRef,
        pageSize,
      });
    },
    [dispatch, loadPageRef, onErrorRef, requestVersionRef, activeRequestRef, pageSize],
  );
}

type PaginationRefs<T extends { id: string }> = {
  stateRef: RefObject<PaginationState<T>>;
  loadPageRef: RefObject<Options<T>["loadPage"]>;
  onErrorRef: RefObject<Options<T>["onError"]>;
  requestVersionRef: RefObject<number>;
  activeRequestRef: RefObject<number | null>;
  loadedQueryKeyRef: RefObject<string | null>;
};

function usePaginationRefs<T extends { id: string }>(options: {
  state: PaginationState<T>;
  loadPage: Options<T>["loadPage"];
  onError: Options<T>["onError"];
}): PaginationRefs<T> {
  const stateRef = useRef(options.state);
  const loadPageRef = useRef(options.loadPage);
  const onErrorRef = useRef(options.onError);
  const requestVersionRef = useRef(0);
  const activeRequestRef = useRef<number | null>(null);
  const loadedQueryKeyRef = useRef<string | null>(null);
  useLayoutEffect(() => {
    stateRef.current = options.state;
    loadPageRef.current = options.loadPage;
    onErrorRef.current = options.onError;
  });
  return {
    stateRef,
    loadPageRef,
    onErrorRef,
    requestVersionRef,
    activeRequestRef,
    loadedQueryKeyRef,
  };
}

function useRetryAction<T extends { id: string }>(options: {
  enabled: boolean;
  stateRef: RefObject<PaginationState<T>>;
  requestVersionRef: RefObject<number>;
  activeRequestRef: RefObject<number | null>;
  dispatch: Dispatch<PaginationAction<T>>;
  execute: (version: number, offset: number, append: boolean) => Promise<void>;
  reload: () => void;
}): () => void {
  const { enabled, stateRef, requestVersionRef, activeRequestRef, dispatch, execute, reload } =
    options;
  return useCallback(() => {
    requestRetry({
      enabled,
      stateRef,
      requestVersionRef,
      activeRequestRef,
      dispatch,
      execute,
      reload,
    });
  }, [enabled, stateRef, requestVersionRef, activeRequestRef, dispatch, execute, reload]);
}

function usePaginationActions<T extends { id: string }>(options: {
  enabled: boolean;
  queryKey: string;
  stateRef: RefObject<PaginationState<T>>;
  requestVersionRef: RefObject<number>;
  activeRequestRef: RefObject<number | null>;
  loadedQueryKeyRef: RefObject<string | null>;
  dispatch: Dispatch<PaginationAction<T>>;
  execute: (version: number, offset: number, append: boolean) => Promise<void>;
}): PaginationActions {
  const {
    enabled,
    queryKey,
    stateRef,
    requestVersionRef,
    activeRequestRef,
    loadedQueryKeyRef,
    dispatch,
    execute,
  } = options;
  const reload = useCallback(() => {
    requestReload({ enabled, queryKey, requestVersionRef, loadedQueryKeyRef, dispatch, execute });
  }, [enabled, execute, queryKey, dispatch, requestVersionRef, loadedQueryKeyRef]);
  const loadMore = useCallback(() => {
    requestLoadMore({
      enabled,
      stateRef,
      requestVersionRef,
      activeRequestRef,
      dispatch,
      execute,
    });
  }, [enabled, execute, dispatch, stateRef, requestVersionRef, activeRequestRef]);
  const retry = useRetryAction({
    enabled,
    stateRef,
    requestVersionRef,
    activeRequestRef,
    dispatch,
    execute,
    reload,
  });
  return { reload, loadMore, retry };
}

function usePaginationEffects(options: {
  enabled: boolean;
  queryKey: string;
  reload: () => void;
  loadedQueryKeyRef: RefObject<string | null>;
  requestVersionRef: RefObject<number>;
  activeRequestRef: RefObject<number | null>;
}): void {
  const { enabled, queryKey, reload, loadedQueryKeyRef, requestVersionRef, activeRequestRef } =
    options;
  useEffect(() => {
    if (!enabled || loadedQueryKeyRef.current === queryKey) return;
    loadedQueryKeyRef.current = queryKey;
    reload();
  }, [enabled, queryKey, reload, loadedQueryKeyRef]);
  useEffect(
    () => () => {
      requestVersionRef.current += 1;
      activeRequestRef.current = null;
    },
    [requestVersionRef, activeRequestRef],
  );
}

export function usePaginatedList<T extends { id: string }>({
  enabled,
  queryKey,
  pageSize,
  loadPage,
  onError,
}: Options<T>): PaginatedList<T> {
  const [state, dispatch] = useReducer(paginationReducer<T>, undefined, initialPaginationState<T>);
  const refs = usePaginationRefs({ state, loadPage, onError });

  const execute = usePageRequestExecutor<T>({
    dispatch,
    loadPageRef: refs.loadPageRef,
    onErrorRef: refs.onErrorRef,
    requestVersionRef: refs.requestVersionRef,
    activeRequestRef: refs.activeRequestRef,
    pageSize,
  });
  const { reload, loadMore, retry } = usePaginationActions({
    enabled,
    queryKey,
    stateRef: refs.stateRef,
    requestVersionRef: refs.requestVersionRef,
    activeRequestRef: refs.activeRequestRef,
    loadedQueryKeyRef: refs.loadedQueryKeyRef,
    dispatch,
    execute,
  });
  usePaginationEffects({
    enabled,
    queryKey,
    reload,
    loadedQueryKeyRef: refs.loadedQueryKeyRef,
    requestVersionRef: refs.requestVersionRef,
    activeRequestRef: refs.activeRequestRef,
  });

  return {
    ...state,
    isInitialLoading: state.phase === "initial-loading",
    isLoadingMore: state.phase === "loading-more",
    reload,
    loadMore,
    retry,
  };
}
