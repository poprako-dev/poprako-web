import { useCallback } from "react";
import type { ComicInfo } from "@/route/_authenticated/business/comic/comic";
import type { Result } from "@/shared/utility/result";
import type { ComicListMode } from "./comic-list-mode";
import type { ComicTranslationListItem } from "@/route/_authenticated/_shell/business/comic-list/comic-list";

type LoadPage = (
  offset: number,
  limit: number,
  signal?: AbortSignal,
) => Promise<Result<ComicInfo[]>>;

type LoadComics = (
  offset: number,
  limit: number,
  mode: ComicListMode,
  signal?: AbortSignal,
) => Promise<Result<ComicInfo[]>>;

export function useComicListLoaders(onLoadComics: LoadComics): {
  loadComicCards: (
    offset: number,
    limit: number,
    signal?: AbortSignal,
  ) => Promise<Result<ComicTranslationListItem[]>>;
  loadArchivedComics: LoadPage;
  loadComicProgress: (
    offset: number,
    limit: number,
    signal?: AbortSignal,
  ) => Promise<Result<ComicInfo[]>>;
} {
  const loadComicCards = useCallback(
    async (
      offset: number,
      limit: number,
      signal?: AbortSignal,
    ): Promise<Result<ComicTranslationListItem[]>> => {
      const result = await onLoadComics(offset, limit, "translator", signal);
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
    async (offset: number, limit: number, signal?: AbortSignal) =>
      onLoadComics(offset, limit, "reviewer", signal),
    [onLoadComics],
  );
  const loadArchivedComics = useCallback(
    async (offset: number, limit: number, signal?: AbortSignal) =>
      onLoadComics(offset, limit, "archive", signal),
    [onLoadComics],
  );
  return { loadComicCards, loadComicProgress, loadArchivedComics };
}
