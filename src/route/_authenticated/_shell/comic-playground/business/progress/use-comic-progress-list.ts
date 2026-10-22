import type { ComicInfo } from "@/route/_authenticated/business/comic/comic";
import type { PageLoader } from "@/shared/hook/paged-list";
import { usePagedList, type PagedListState } from "@/shared/hook/use-paged-list";
import { useAppStore } from "@/route/business/session/session-store";

export function useComicProgressList(
  onLoadComics: PageLoader<ComicInfo>,
): PagedListState<ComicInfo> {
  const generation = useAppStore((state) => state.generation);
  return usePagedList({ loader: onLoadComics, pageSize: 20, resetKey: generation });
}
