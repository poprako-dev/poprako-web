import type { ComicDetailMode } from "@/route/_authenticated/business/navigation/workbench-navigation";
import type { JSX } from "react";
import { ComicList } from "@/route/_authenticated/_shell/comic-playground/business/comic-list/ComicList";
import { ComicCreatorModal } from "@/route/_authenticated/_shell/comic-playground/business/ComicCreatorModal";
import { WorksetCreatorModal } from "@/route/_authenticated/_shell/comic-playground/business/WorksetCreatorModal";
import { AsyncComicDetail } from "@/route/_authenticated/_shell/business/comic-detail/AsyncComicDetail";
import {
  type ComicDetailSearch,
  type WorkbenchDestination,
  useComicDetailHost,
} from "@/route/_authenticated/_shell/business/comic-detail/use-comic-detail-host";
import { useComicPlaygroundActions } from "@/route/_authenticated/_shell/comic-playground/business/use-comic-playground-actions";
import { useComicPlaygroundPageModel } from "@/route/_authenticated/_shell/comic-playground/business/use-comic-playground-page-model";

type Props = {
  search: ComicDetailSearch;
  onChangeSearch: (
    comicId: string | null,
    chapterId: string | null,
    mode?: ComicDetailMode,
  ) => void;
  onNavigateToWorkbench: (destination: WorkbenchDestination) => void;
  onWorkbenchIntent?: ((mode: ComicDetailMode) => void) | undefined;
};

export function ComicPlayground({
  search,
  onChangeSearch,
  onNavigateToWorkbench,
  onWorkbenchIntent,
}: Props): JSX.Element {
  const {
    client,
    teamId,
    activeMember,
    showToast,
    isAdmin,
    filters,
    worksets,
    comicListRefreshKey,
    setComicListRefreshKey,
    comicCreatorTeamId,
    setComicCreatorTeamId,
    showWorksetCreatorModal,
    setShowWorksetCreatorModal,
  } = useComicPlaygroundPageModel();
  const {
    worksets: worksetItems,
    activeWorksetId,
    setActiveWorksetId,
    activeWorkset,
    loadWorksets,
    handleCreateWorkset,
  } = worksets;

  const detail = useComicDetailHost({
    returnTo: "/comic-playground",
    showToast,
    search,
    onChangeSearch,
    onNavigateToWorkbench,
  });

  const actions = useComicPlaygroundActions({
    client,
    activeWorksetId,
    activeTitle: filters.activeFuzzyTitle,
    activeStages: filters.activeStages,
    loadWorksets,
    retryComicDetail: detail.retryComicDetail,
    setRefreshKey: setComicListRefreshKey,
  });

  return (
    <>
      <ComicList
        refreshKey={comicListRefreshKey}
        worksets={worksetItems}
        activeWorksetId={activeWorksetId}
        onChangeWorkset={setActiveWorksetId}
        onCreateWorkset={() => {
          setShowWorksetCreatorModal(true);
        }}
        onUpdateWorkset={isAdmin ? actions.handleUpdateWorkset : undefined}
        onLoadComics={actions.handleLoadComics}
        onComicClick={detail.openComicDetail}
        onCreateComic={
          isAdmin && activeWorkset
            ? () => {
                setComicCreatorTeamId(teamId);
              }
            : undefined
        }
        onChangeFuzzyTitle={filters.setActiveFuzzyTitle}
        activeFuzzyTitle={filters.activeFuzzyTitle}
        activeUploadStatus={filters.activeUploadStatus}
        activeTranslateStatus={filters.activeTranslateStatus}
        activeProofreadStatus={filters.activeProofreadStatus}
        activeTypesetStatus={filters.activeTypesetStatus}
        activeReviewStatus={filters.activeReviewStatus}
        activePublishStatus={filters.activePublishStatus}
        onChangeUploadStatus={filters.setActiveUploadStatus}
        onChangeTranslateStatus={filters.setActiveTranslateStatus}
        onChangeProofreadStatus={filters.setActiveProofreadStatus}
        onChangeTypesetStatus={filters.setActiveTypesetStatus}
        onChangeReviewStatus={filters.setActiveReviewStatus}
        onChangePublishStatus={filters.setActivePublishStatus}
      />
      <AsyncComicDetail
        isOpen={detail.isDetailOpen}
        error={detail.detailError}
        onRetry={detail.retryComicDetail}
        comicInfo={detail.selectedComic}
        pinnedChapter={detail.selectedComicPinnedChapter}
        mode={detail.detailMode}
        onModeChange={detail.changeDetailMode}
        initialChapterId={detail.urlChapterId}
        onNavigateToWorkbench={detail.navigateToWorkbench}
        onWorkbenchIntent={onWorkbenchIntent}
        onChanged={actions.handleDetailChanged}
        onClose={detail.clearComicDetail}
      />
      {comicCreatorTeamId === teamId && isAdmin && activeWorkset && (
        <ComicCreatorModal
          currWorkset={activeWorkset}
          activeMember={activeMember}
          onCreateComic={actions.handleCreateComic}
          onClose={() => {
            setComicCreatorTeamId(null);
          }}
        />
      )}
      {showWorksetCreatorModal && teamId && (
        <WorksetCreatorModal
          teamId={teamId}
          onCreateWorkset={handleCreateWorkset}
          onClose={() => {
            setShowWorksetCreatorModal(false);
          }}
        />
      )}
    </>
  );
}
