import { useCallback, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { ChapterInfo } from "@/route/_authenticated/business/chapter/chapter";

type Collection = {
  listed: ChapterInfo[];
  located: ChapterInfo | null;
};

function visibleChapters({ listed, located }: Collection): ChapterInfo[] {
  return located && !listed.some((chapter) => chapter.id === located.id)
    ? [...listed, located]
    : listed;
}

function updateCollection(previous: Collection, update: SetStateAction<ChapterInfo[]>): Collection {
  if (typeof update !== "function") return { listed: update, located: null };
  const chapters = update(visibleChapters(previous));
  const listedIds = new Set(previous.listed.map((chapter) => chapter.id));
  return {
    listed: chapters.filter((chapter) => listedIds.has(chapter.id)),
    located: previous.located
      ? (chapters.find((chapter) => chapter.id === previous.located?.id) ?? null)
      : null,
  };
}

export function useChapterCollection(): {
  chapters: ChapterInfo[];
  listed: ChapterInfo[];
  setChapters: Dispatch<SetStateAction<ChapterInfo[]>>;
  setListed: Dispatch<SetStateAction<ChapterInfo[]>>;
  setLocated: (chapter: ChapterInfo | null) => void;
} {
  const [collection, setCollection] = useState<Collection>({ listed: [], located: null });
  const setChapters = useCallback((update: SetStateAction<ChapterInfo[]>) => {
    setCollection((previous) => updateCollection(previous, update));
  }, []);
  const setListed = useCallback((update: SetStateAction<ChapterInfo[]>) => {
    setCollection((previous) => ({
      ...previous,
      listed: typeof update === "function" ? update(previous.listed) : update,
    }));
  }, []);
  const setLocated = useCallback((located: ChapterInfo | null) => {
    setCollection((previous) => ({ ...previous, located }));
  }, []);
  return {
    chapters: visibleChapters(collection),
    listed: collection.listed,
    setChapters,
    setListed,
    setLocated,
  };
}
