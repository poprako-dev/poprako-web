import { ComicListModeSelector } from "./ComicListModeSelector";
import { ComicArchiveList } from "../archive/ComicArchiveList";
import { type JSX, useState } from "react";
import type { ComicInfo } from "@/route/_authenticated/business/comic/comic";
import type { Result } from "@/shared/utility/result";
import type { WorksetInfo } from "@/route/_authenticated/business/workset/workset";
import type { ComicListMode } from "./comic-list-mode";
import type {
  BinaryFilter,
  TripleFilter,
} from "@/route/_authenticated/_shell/business/comic-list/comic-list";
import { ComicListLayout } from "@/route/_authenticated/_shell/comic-playground/business/comic-list/ComicListLayout";
import { FilterHeader } from "@/route/_authenticated/_shell/comic-playground/business/comic-list/FilterHeader";
import { ComicTranslationList } from "@/route/_authenticated/_shell/business/comic-list/ComicTranslationList";
import { WorksetSidebar } from "@/route/_authenticated/_shell/comic-playground/business/comic-list/WorksetSidebar";
import { ComicProgressList } from "@/route/_authenticated/_shell/comic-playground/business/progress/ComicProgressList";
import { useComicListLoaders } from "@/route/_authenticated/_shell/comic-playground/business/comic-list/use-comic-list-loaders";

type Props = {
  initialMode?: ComicListMode | undefined;
  refreshKey?: number | undefined;
  worksets: WorksetInfo[];
  activeWorksetId: string;
  onChangeWorkset: (worksetId: string) => void;
  onCreateWorkset: () => void;
  onDeleteWorkset?: ((id: string) => Promise<Result<void>>) | undefined;
  onUpdateWorkset?:
    | ((
        id: string,
        args: { name: string; description?: string | undefined },
      ) => Promise<Result<void>>)
    | undefined;
  onLoadComics: (
    offset: number,
    limit: number,
    mode: ComicListMode,
    signal?: AbortSignal,
  ) => Promise<Result<ComicInfo[]>>;
  onComicClick: (comicId: string, chapterId?: string | null) => void;
  onCreateComic?: (() => void) | undefined;
  onExportArchives?: (() => void) | undefined;
  onChangeFuzzyTitle: (title: string) => void;
  activeFuzzyTitle?: string | undefined;
  activeUploadStatus: BinaryFilter;
  activeTranslateStatus: TripleFilter;
  activeProofreadStatus: TripleFilter;
  activeTypesetStatus: TripleFilter;
  activeReviewStatus: BinaryFilter;
  activePublishStatus: BinaryFilter;
  onChangeUploadStatus: (s: BinaryFilter) => void;
  onChangeTranslateStatus: (s: TripleFilter) => void;
  onChangeProofreadStatus: (s: TripleFilter) => void;
  onChangeTypesetStatus: (s: TripleFilter) => void;
  onChangeReviewStatus: (s: BinaryFilter) => void;
  onChangePublishStatus: (s: BinaryFilter) => void;
};

export function ComicList({
  initialMode = "translator",
  refreshKey = 0,
  worksets,
  activeWorksetId,
  onChangeWorkset,
  onCreateWorkset,
  onLoadComics,
  onComicClick,
  onCreateComic,
  onExportArchives,
  onUpdateWorkset,
  onDeleteWorkset,
  onChangeFuzzyTitle,
  activeFuzzyTitle,
  activeUploadStatus,
  activeTranslateStatus,
  activeProofreadStatus,
  activeTypesetStatus,
  activeReviewStatus,
  activePublishStatus,
  onChangeUploadStatus,
  onChangeTranslateStatus,
  onChangeProofreadStatus,
  onChangeTypesetStatus,
  onChangeReviewStatus,
  onChangePublishStatus,
}: Props): JSX.Element {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth >= 768);
  const [activeMode, setActiveMode] = useState<ComicListMode>(initialMode);

  const handleToggleSidebar = (): void => {
    setIsSidebarOpen((prev) => !prev);
  };

  const { loadComicCards, loadComicProgress, loadArchivedComics } =
    useComicListLoaders(onLoadComics);

  return (
    <ComicListLayout
      isSidebarOpen={isSidebarOpen}
      onCloseSidebar={() => {
        setIsSidebarOpen(false);
      }}
      header={
        <FilterHeader
          progressDisabled={activeMode === "archive"}
          activeFuzzyTitle={activeFuzzyTitle}
          onChangeFuzzyTitle={onChangeFuzzyTitle}
          activeUploadStatus={activeUploadStatus}
          activeTranslateStatus={activeTranslateStatus}
          activeProofreadStatus={activeProofreadStatus}
          activeTypesetStatus={activeTypesetStatus}
          activeReviewStatus={activeReviewStatus}
          activePublishStatus={activePublishStatus}
          onChangeUploadStatus={onChangeUploadStatus}
          onChangeTranslateStatus={onChangeTranslateStatus}
          onChangeProofreadStatus={onChangeProofreadStatus}
          onChangeTypesetStatus={onChangeTypesetStatus}
          onChangeReviewStatus={onChangeReviewStatus}
          onChangePublishStatus={onChangePublishStatus}
          onCreateComic={onCreateComic}
          onExportArchives={onExportArchives}
          onToggleSidebar={handleToggleSidebar}
        />
      }
      content={
        <div className="w-full h-full min-h-0 flex flex-col overflow-hidden">
          <ComicListModeSelector mode={activeMode} onChange={setActiveMode} />

          {activeMode === "translator" && (
            <ComicTranslationList
              key={`translator-${String(refreshKey)}`}
              onLoadComics={loadComicCards}
              onComicClick={(comicId, chapterId) => {
                if (window.innerWidth < 768) setIsSidebarOpen(false);
                onComicClick(comicId, chapterId);
              }}
            />
          )}
          {activeMode === "archive" && (
            <ComicArchiveList
              key={`archive-${String(refreshKey)}`}
              onLoadComics={loadArchivedComics}
            />
          )}
          {activeMode === "reviewer" && (
            <ComicProgressList
              key={`reviewer-${String(refreshKey)}`}
              onLoadComics={loadComicProgress}
              onComicClick={(comicInfo) => {
                if (window.innerWidth < 768) setIsSidebarOpen(false);
                onComicClick(comicInfo.id, comicInfo.pinnedChapter?.id);
              }}
            />
          )}
        </div>
      }
      sidebar={
        <WorksetSidebar
          activeWorksetId={activeWorksetId}
          worksets={worksets}
          onClose={() => {
            setIsSidebarOpen(false);
          }}
          onCreateWorkset={onCreateWorkset}
          onChangeWorkset={onChangeWorkset}
          onUpdateWorkset={onUpdateWorkset}
          onDeleteWorkset={onDeleteWorkset}
        />
      }
    />
  );
}
