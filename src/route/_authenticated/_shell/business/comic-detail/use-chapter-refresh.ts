import { useCallback } from "react";
import type { ChapterInfo } from "@/route/_authenticated/business/chapter/chapter";

export function useChapterRefresh(
  reloadListed: () => Promise<ChapterInfo[] | null>,
  reloadLocated: () => Promise<ChapterInfo | null>,
  hasExtraChapter: boolean,
): () => Promise<ChapterInfo[] | null> {
  return useCallback(async () => {
    const [listed, located] = await Promise.all([
      reloadListed(),
      hasExtraChapter ? reloadLocated() : Promise.resolve(null),
    ]);
    if (!listed || (hasExtraChapter && !located)) return null;
    return located && !listed.some((chapter) => chapter.id === located.id)
      ? [...listed, located]
      : listed;
  }, [reloadListed, reloadLocated, hasExtraChapter]);
}
