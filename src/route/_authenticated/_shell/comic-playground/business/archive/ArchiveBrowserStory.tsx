import { useComicPlaygroundFilters } from "../use-comic-playground-filters";
import { useCallback, useState, type ComponentProps, type ReactElement } from "react";
import { ComicList } from "../comic-list/ComicList";
import { archiveListProps } from "./archive-story-fixture";
import { archivedComics, archiveWorksets } from "./archive-browser-fixture";

type Props = Partial<ComponentProps<typeof ComicList>>;

export function ArchiveBrowserStory(args: Props): ReactElement {
  const filters = useComicPlaygroundFilters();
  const title = filters.activeFuzzyTitle;
  const [workset, setWorkset] = useState("archive-workset-0");
  const load = useCallback<NonNullable<Props["onLoadComics"]>>(
    (offset, limit, mode) => {
      const rows = archivedComics.filter(
        (comic) =>
          comic.worksetId === workset &&
          `${comic.title} ${comic.author} ${String(comic.index + 1)}`.includes(title),
      );
      return Promise.resolve({
        success: true,
        data: rows
          .slice(offset, offset + limit)
          .map((comic) =>
            mode === "archive"
              ? comic
              : { ...comic, title: `进行中 · ${comic.title}`, archivedAt: null },
          ),
      });
    },
    [title, workset],
  );
  return (
    <main className="h-dvh">
      <ComicList
        {...archiveListProps}
        initialMode="archive"
        worksets={archiveWorksets}
        activeWorksetId={workset}
        onChangeWorkset={setWorkset}
        activeFuzzyTitle={title}
        onChangeFuzzyTitle={filters.setActiveFuzzyTitle}
        activeUploadStatus={filters.activeUploadStatus}
        onChangeUploadStatus={filters.setActiveUploadStatus}
        activeTranslateStatus={filters.activeTranslateStatus}
        onChangeTranslateStatus={filters.setActiveTranslateStatus}
        activeProofreadStatus={filters.activeProofreadStatus}
        onChangeProofreadStatus={filters.setActiveProofreadStatus}
        activeTypesetStatus={filters.activeTypesetStatus}
        onChangeTypesetStatus={filters.setActiveTypesetStatus}
        activeReviewStatus={filters.activeReviewStatus}
        onChangeReviewStatus={filters.setActiveReviewStatus}
        activePublishStatus={filters.activePublishStatus}
        onChangePublishStatus={filters.setActivePublishStatus}
        onLoadComics={load}
        {...args}
      />
    </main>
  );
}
