import type { PageLoader } from "@/shared/hook/paged-list";
import { usePagedList, type PagedListState } from "@/shared/hook/use-paged-list";
import type { ComicTranslationListItem } from "./comic-list";
import { useAppStore } from "@/route/business/session/session-store";

export type ComicTranslationListState = PagedListState<ComicTranslationListItem>;

export function useComicTranslationList(
  onLoadComics: PageLoader<ComicTranslationListItem>,
  resetKey?: string | number,
): ComicTranslationListState {
  const generation = useAppStore((state) => state.generation);
  return usePagedList({
    loader: onLoadComics,
    pageSize: 12,
    resetKey: JSON.stringify([generation, resetKey]),
  });
}
