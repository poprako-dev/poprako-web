import { useState, useCallback } from "react";
import clsx from "clsx";
import { PencilLine, Eye } from "lucide-react";
import type { ComicInfo } from "@/types";
import type { Result } from "@/types/utils/result";
import type { WorksetInfo } from "@/types/workset";
import type { ViewMode } from "@/features/ComicCard/types/types";
import type {
  BinaryFilter,
  ComicTranslationListItem,
  TripleFilter,
} from "../../types/types";
import ComicListLayout from "../../layouts/ComicListLayout";
import FilterHeader from "./FilterHeader";
import ComicTranslationList from "./ComicTranslationList";
import WorksetSidebar from "./WorksetSidebar";
import ComicProgressList from "@/features/ComicProgressList";

interface Props {
  initialMode?: ViewMode | undefined;
  refreshKey?: number | undefined;
  worksets: WorksetInfo[];
  activeWorksetId: string;
  onChangeWorkset: (worksetId: string) => void;
  onCreateWorkset: () => void;
  onUpdateWorkset?: ((
    id: string,
    args: { name: string; description?: string | undefined },
  ) => Promise<Result<void>>) | undefined;
  onLoadComics: (
    offset: number,
    limit: number,
    mode: ViewMode,
  ) => Promise<Result<ComicInfo[]>>;
  onComicClick?: ((comicId: string, chapterId?: string | null) => void) | undefined;
  onCreateComic?: (() => void) | undefined;
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
}

export default function ComicList({
  initialMode = "translator",
  refreshKey = 0,
  worksets,
  activeWorksetId,
  onChangeWorkset,
  onCreateWorkset,
  onLoadComics,
  onComicClick,
  onCreateComic,
  onUpdateWorkset,
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

  const loadComicCards = useCallback(
    async (
      offset: number,
      limit: number,
    ): Promise<Result<ComicTranslationListItem[]>> => {
      const result = await onLoadComics(offset, limit, "translator");
      if (!result.success) {return result;}

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

  return (
    <ComicListLayout
      isSidebarOpen={isSidebarOpen}
      onCloseSidebar={() => { setIsSidebarOpen(false); }}
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
            <div className="flex rounded-lg bg-stone-100/80 p-0.5">
              <button
                type="button"
                onClick={() => { setActiveMode("translator"); }}
                title="翻译模式"
                className={clsx(
                  "rounded-md px-3 py-1.5",
                  "flex items-center gap-2",
                  "transition-all duration-200 focus:outline-none",
                  activeMode === "translator"
                    ? "bg-gray-200 text-gray-800 shadow-(--shadow-sm)"
                    : "text-slate-400 hover:text-slate-600",
                )}
              >
                <PencilLine size={16} />
              </button>
              <button
                type="button"
                onClick={() => { setActiveMode("reviewer"); }}
                title="监修模式"
                className={clsx(
                  "rounded-md px-3 py-1.5",
                  "flex items-center gap-2",
                  "transition-all duration-200 focus:outline-none",
                  activeMode === "reviewer"
                    ? "bg-gray-200 text-gray-800 shadow-(--shadow-sm)"
                    : "text-slate-400 hover:text-slate-600",
                )}
              >
                <Eye size={16} />
              </button>
            </div>
          </div>

          {activeMode === "translator" && (
            <ComicTranslationList
              key={`translator-${String(refreshKey)}`}
              onLoadComics={loadComicCards}
              onComicClick={(comicId, chapterId) => {
                if (window.innerWidth < 768) {setIsSidebarOpen(false);}
                onComicClick?.(comicId, chapterId);
              }}
            />
          )}
          {activeMode === "reviewer" && (
            <ComicProgressList
              key={`reviewer-${String(refreshKey)}`}
              onLoadComics={loadComicProgress}
              onComicClick={(comicInfo) => {
                if (window.innerWidth < 768) {setIsSidebarOpen(false);}
                onComicClick?.(comicInfo.id, comicInfo.pinnedChapter?.id);
              }}
            />
          )}
        </div>
      }
      sidebar={
        <WorksetSidebar
          activeWorksetId={activeWorksetId}
          worksets={worksets}
          onClose={() => { setIsSidebarOpen(false); }}
          onCreateWorkset={onCreateWorkset}
          onChangeWorkset={onChangeWorkset}
          onUpdateWorkset={onUpdateWorkset}
        />
      }
    />
  );
}
