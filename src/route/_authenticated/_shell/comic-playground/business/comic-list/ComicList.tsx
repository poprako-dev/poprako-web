import type { ComicDetailMode } from "@/route/_authenticated/business/navigation/workbench-navigation";
import { type JSX, useState } from "react";
import clsx from "clsx";
import { Eye, PencilLine } from "lucide-react";
import type { ComicInfo } from "@/route/_authenticated/business/comic/comic";
import type { Result } from "@/shared/utility/result";
import type { WorksetInfo } from "@/route/_authenticated/business/workset/workset";
import type { ViewMode } from "@/route/_authenticated/_shell/business/comic-list/comic-card-type";
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
  initialMode?: ViewMode | undefined;
  refreshKey?: number | undefined;
  worksets: WorksetInfo[];
  activeWorksetId: string;
  onChangeWorkset: (worksetId: string) => void;
  onCreateWorkset: () => void;
  onUpdateWorkset?:
    | ((
        id: string,
        args: { name: string; description?: string | undefined },
      ) => Promise<Result<void>>)
    | undefined;
  onLoadComics: (offset: number, limit: number, mode: ViewMode) => Promise<Result<ComicInfo[]>>;
  onComicClick: (comicId: string, chapterId?: string | null, mode?: ComicDetailMode) => void;
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
}: Props): JSX.Element {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth >= 768);
  const [activeMode, setActiveMode] = useState<ViewMode>(initialMode);

  const handleToggleSidebar = (): void => {
    setIsSidebarOpen((prev) => !prev);
  };

  const { loadComicCards, loadComicProgress } = useComicListLoaders(onLoadComics);

  return (
    <ComicListLayout
      isSidebarOpen={isSidebarOpen}
      onCloseSidebar={() => {
        setIsSidebarOpen(false);
      }}
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
                    "linear-gradient(90deg, rgba(148,163,184,1) 0%," + " rgba(148,163,184,0) 60%)",
                }}
              />
            </div>
            <div className="flex rounded-lg bg-surface-stone-100/80 p-0.5">
              <button
                type="button"
                onClick={() => {
                  setActiveMode("translator");
                }}
                title="翻译模式"
                className={clsx(
                  "rounded-md px-3 py-1.5",
                  "flex items-center gap-2",
                  "transition-all duration-200 focus:outline-none",
                  activeMode === "translator"
                    ? "bg-surface-gray-200 text-ink-gray-800 shadow-(--shadow-sm)"
                    : "text-text-muted-cool hover:text-ink-slate-600",
                )}
              >
                <PencilLine size={16} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveMode("reviewer");
                }}
                title="监修模式"
                className={clsx(
                  "rounded-md px-3 py-1.5",
                  "flex items-center gap-2",
                  "transition-all duration-200 focus:outline-none",
                  activeMode === "reviewer"
                    ? "bg-surface-gray-200 text-ink-gray-800 shadow-(--shadow-sm)"
                    : "text-text-muted-cool hover:text-ink-slate-600",
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
                if (window.innerWidth < 768) setIsSidebarOpen(false);
                onComicClick(comicId, chapterId, "translator");
              }}
            />
          )}
          {activeMode === "reviewer" && (
            <ComicProgressList
              key={`reviewer-${String(refreshKey)}`}
              onLoadComics={loadComicProgress}
              onComicClick={(comicInfo) => {
                if (window.innerWidth < 768) setIsSidebarOpen(false);
                onComicClick(comicInfo.id, comicInfo.pinnedChapter?.id, "reviewer");
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
        />
      }
    />
  );
}
