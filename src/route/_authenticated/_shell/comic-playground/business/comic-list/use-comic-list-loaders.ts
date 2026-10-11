import { useCallback } from "react";
import type { ComicInfo } from "@/route/_authenticated/business/comic/comic";
import type { Result } from "@/shared/utility/result";
import type { ViewMode } from "@/route/_authenticated/_shell/business/comic-list/comic-card-type";
import type { ComicTranslationListItem } from "@/route/_authenticated/_shell/business/comic-list/comic-list";

type LoadComics = (offset: number, limit: number, mode: ViewMode) => Promise<Result<ComicInfo[]>>;

export function useComicListLoaders(onLoadComics: LoadComics): {
  loadComicCards: (offset: number, limit: number) => Promise<Result<ComicTranslationListItem[]>>;
  loadComicProgress: (offset: number, limit: number) => Promise<Result<ComicInfo[]>>;
} {
  const loadComicCards = useCallback(
    async (offset: number, limit: number): Promise<Result<ComicTranslationListItem[]>> => {
      const result = await onLoadComics(offset, limit, "translator");
      if (!result.success) {
        return result;
      }
      return {
        success: true,
        data: result.data.map((comicInfo) => ({
          comicInfo,
          chapter: comicInfo.pinnedChapter,
        })),
      };
    },
    [onLoadComics],
  );
  const loadComicProgress = useCallback(
    async (offset: number, limit: number) => onLoadComics(offset, limit, "reviewer"),
    [onLoadComics],
  );
  return { loadComicCards, loadComicProgress };
}
