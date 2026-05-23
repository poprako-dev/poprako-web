import { useState } from "react";
import clsx from "clsx";
import { PencilLine, Eye } from "lucide-react";
import type { ComicInfo, ChapterInfo } from "@/types";
import type { AssignmentInfo } from "@/types/assignment";
import type { Result } from "@/types/utils/result";
import type { WorksetInfo } from "@/types/workset";
import type { ViewMode } from "@/features/ComicCard/types/types";
import type { BinaryFilter, TripleFilter } from "../../types/types";
import ComicListLayout from "../../layouts/ComicListLayout";
import FilterHeader from "./FilterHeader";
import ComicTranslationList from "./ComicTranslationList";
import WorksetSidebar from "./WorksetSidebar";
import ComicProgressList from "@/features/ComicProgressList";

type Props = {
  initialMode?: ViewMode;
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
  initialMode = "translator",
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    () => window.innerWidth >= 768,
  );
  const [activeMode, setActiveMode] = useState<ViewMode>(initialMode);

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
        <div className="w-full h-full min-h-0 flex flex-col overflow-hidden">
          {/* mode 切换栏 */}
          <div className="flex items-center justify-between shrink-0 pb-3">
            <div className="flex-1 mr-4" aria-hidden="true">
              <div
                className="w-full h-0.5 rounded-sm"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(148,163,184,1) 0%," +
                    " rgba(148,163,184,0) 60%)",
                }}
              />
            </div>
            <div className="flex rounded-lg bg-stone-200/80 p-0.5">
              <button
                type="button"
                onClick={() => setActiveMode("translator")}
                title="翻译模式"
                className={clsx(
                  "rounded-md px-3 py-1.5",
                  "flex items-center gap-2",
                  "transition-all duration-200 focus:outline-none",
                  activeMode === "translator"
                    ? "bg-green-50 text-slate-800 shadow-(--shadow-sm)"
                    : "text-slate-400 hover:text-slate-600",
                )}
              >
                <PencilLine size={16} />
              </button>
              <button
                type="button"
                onClick={() => setActiveMode("reviewer")}
                title="监修模式"
                className={clsx(
                  "rounded-md px-3 py-1.5",
                  "flex items-center gap-2",
                  "transition-all duration-200 focus:outline-none",
                  activeMode === "reviewer"
                    ? "bg-emerald-50 text-slate-800 shadow-(--shadow-sm)"
                    : "text-slate-400 hover:text-slate-600",
                )}
              >
                <Eye size={16} />
              </button>
            </div>
          </div>

          {activeMode === "translator" && (
            <ComicTranslationList
              onLoadComics={onLoadComics}
              onLoadLatestChapter={onLoadLatestChapter}
              onComicClick={(comicInfo) => {
                if (window.innerWidth < 768) setIsSidebarOpen(false);
                onComicClick?.(comicInfo);
              }}
            />
          )}
          {activeMode === "reviewer" && onLoadAssignments && (
            <ComicProgressList
              onLoadComics={onLoadComics}
              onLoadPinnedChapter={onLoadLatestChapter}
              onLoadAssignments={onLoadAssignments}
              onComicClick={(comicInfo) => {
                if (window.innerWidth < 768) setIsSidebarOpen(false);
                onComicClick?.(comicInfo);
              }}
            />
          )}
        </div>
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
