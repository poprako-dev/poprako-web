import { useState } from "react";
import type { ComicInfo, ChapterInfo } from "@/types";
import type { AssignmentInfo } from "@/types/assignment";
import type { Result } from "@/types/utils/result";
import type { WorksetInfo } from "@/types/workset";
import type { ViewMode } from "@/features/ComicCard/types/types";
import type { BinaryFilter, TripleFilter } from "../../types/types";
import ComicListLayout from "../../layouts/ComicListLayout";
import FilterHeader from "./FilterHeader";
import EmbeddedComicList from "./EmbeddedComicList";
import WorksetSidebar from "./WorksetSidebar";

type Props = {
  mode: ViewMode;
  worksets: WorksetInfo[];
  activeWorksetId: string;
  onChangeWorkset: (worksetId: string) => void;
  onCreateWorkset: () => void;
  onDeleteWorkset: (worksetId: string) => void;
  onLoadComics: (
    offset: number,
    limit: number,
  ) => Promise<ComicInfo[] | string>;
  onLoadLatestChapter: (
    comicInfo: ComicInfo,
  ) => Promise<Result<ChapterInfo | null>>;
  onLoadAssignments?: (
    comicInfo: ComicInfo,
  ) => Promise<Result<AssignmentInfo[]>>;
  onComicClick?: (comicInfo: ComicInfo) => void;
  onCreateComic: () => void;
  onChangeFuzzyTitle: (title: string) => void;
  activeFuzzyTitle?: string;
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

export default function ComicList({
  mode,
  worksets,
  activeWorksetId,
  onChangeWorkset,
  onCreateWorkset,
  onDeleteWorkset,
  onLoadComics,
  onLoadLatestChapter,
  onLoadAssignments,
  onComicClick,
  onCreateComic,
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
}: Props) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <ComicListLayout
      isSidebarOpen={isSidebarOpen}
      onCloseSidebar={() => setIsSidebarOpen(false)}
      header={
        <FilterHeader
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
          onToggleSidebar={handleToggleSidebar}
        />
      }
      content={
        <EmbeddedComicList
          mode={mode}
          onLoadComics={onLoadComics}
          onLoadLatestChapter={onLoadLatestChapter}
          onLoadAssignments={onLoadAssignments}
          onComicClick={onComicClick}
        />
      }
      sidebar={
        <WorksetSidebar
          activeWorksetId={activeWorksetId}
          worksets={worksets}
          onClose={() => setIsSidebarOpen(false)}
          onCreateWorkset={onCreateWorkset}
          onDeleteWorkset={onDeleteWorkset}
          onChangeWorkset={onChangeWorkset}
        />
      }
    />
  );
}
