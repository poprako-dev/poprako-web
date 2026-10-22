import type { ReactElement } from "react";
import type { PageLoader } from "@/shared/hook/paged-list";
import type { ComicTranslationListItem } from "./comic-list";
import { useComicTranslationList } from "./use-comic-translation-list";
import { ComicTranslationListView } from "./ComicTranslationListView";

type Props = {
  onLoadComics: PageLoader<ComicTranslationListItem>;
  onComicClick: (comicId: string, chapterId?: string | null) => void;
};

export function ComicTranslationList({ onLoadComics, onComicClick }: Props): ReactElement {
  const state = useComicTranslationList(onLoadComics);
  return <ComicTranslationListView state={state} onComicClick={onComicClick} />;
}
