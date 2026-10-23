import { useEffect, useMemo, useSyncExternalStore } from "react";
import { PagedList, type PageLoader, type PagedListSnapshot } from "./paged-list";

export type PagedListState<Item> = PagedListSnapshot<Item> & {
  loadMore: () => Promise<void>;
  retry: () => Promise<void>;
};

type Options<Item> = {
  loader: PageLoader<Item>;
  pageSize: number;
  resetKey?: string | number | undefined;
};

function createList<Item>({ loader, pageSize }: Options<Item>): PagedList<Item> {
  return new PagedList(loader, pageSize);
}

export function usePagedList<Item>(options: Options<Item>): PagedListState<Item> {
  const { loader, pageSize, resetKey } = options;
  const list = useMemo(
    () => createList({ loader, pageSize, resetKey }),
    [loader, pageSize, resetKey],
  );
  const state = useSyncExternalStore(list.subscribe, list.getSnapshot);
  useEffect(() => list.start(), [list]);
  return { ...state, loadMore: list.loadMore, retry: list.retry };
}
