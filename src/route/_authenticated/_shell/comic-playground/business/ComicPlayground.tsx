import type { ComicDetailMode } from "@/route/_authenticated/business/navigation/workbench-navigation";
import { ComicDetailLoadState } from "@/route/_authenticated/_shell/business/comic-detail/ComicDetailLoadState";
import type { JSX } from "react";
import { useCallback, useState } from "react";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import { showLocalApiFailure } from "@/route/business/request-error";
import { useTeamSelection } from "@/route/business/session/use-active-team";
import { useApiClient } from "@/route/business/api-context";
import { ComicList } from "@/route/_authenticated/_shell/comic-playground/business/comic-list/ComicList";
import { ComicCreatorModal } from "@/route/_authenticated/_shell/comic-playground/business/ComicCreatorModal";
import { WorksetCreatorModal } from "@/route/_authenticated/_shell/comic-playground/business/WorksetCreatorModal";
import { ComicDetailModal } from "@/route/_authenticated/_shell/business/comic-detail/ComicDetailModal";
import { createComic, listComics } from "@/route/_authenticated/business/comic/comic-request";
import { updateWorkset } from "@/route/_authenticated/_shell/comic-playground/business/workset/workset-request";
import type { ComicInfo } from "@/route/_authenticated/business/comic/comic";
import type { Result } from "@/shared/utility/result";
import type { CreateComicArgs } from "@/route/_authenticated/business/comic/comic-input";
import { hasRole } from "@/route/business/identity/role";
import {
  type ComicDetailSearch,
  type WorkbenchDestination,
  useComicDetailHost,
} from "@/route/_authenticated/_shell/business/comic-detail/use-comic-detail-host";
import { useComicPlaygroundFilters } from "@/route/_authenticated/_shell/comic-playground/business/use-comic-playground-filters";
import { useComicPlaygroundWorksets } from "@/route/_authenticated/_shell/comic-playground/business/use-comic-playground-worksets";

type Props = {
  search: ComicDetailSearch;
  onChangeSearch: (
    comicId: string | null,
    chapterId: string | null,
    mode?: ComicDetailMode,
  ) => void;
  onNavigateToWorkbench: (destination: WorkbenchDestination) => void;
};

export function ComicPlayground({
  search,
  onChangeSearch,
  onNavigateToWorkbench,
}: Props): JSX.Element {
  const client = useApiClient();
  const teamSelection = useTeamSelection();
  const teamId = teamSelection.status === "ready" ? teamSelection.activeTeamId : null;
  const activeMember = teamSelection.status === "ready" ? teamSelection.activeMember : null;
  const showToast = useToastStore((s) => s.showToast);

  const [comicListRefreshKey, setComicListRefreshKey] = useState(0);
  const [comicCreatorTeamId, setComicCreatorTeamId] = useState<string | null>(null);
  const [showWorksetCreatorModal, setShowWorksetCreatorModal] = useState(false);
  const isAdmin = activeMember !== null && hasRole(activeMember, "admin");
  const {
    activeStages,
    activeFuzzyTitle,
    setActiveFuzzyTitle,
    activeUploadStatus,
    setActiveUploadStatus,
    activeTranslateStatus,
    setActiveTranslateStatus,
    activeProofreadStatus,
    setActiveProofreadStatus,
    activeTypesetStatus,
    setActiveTypesetStatus,
    activeReviewStatus,
    setActiveReviewStatus,
    activePublishStatus,
    setActivePublishStatus,
  } = useComicPlaygroundFilters();
  const {
    worksets,
    activeWorksetId,
    setActiveWorksetId,
    activeWorkset,
    loadWorksets,
    handleCreateWorkset,
  } = useComicPlaygroundWorksets({ teamId, showToast });

  const handleLoadComics = useCallback(
    async (
      offset: number,
      limit: number,
      mode: "translator" | "reviewer",
    ): Promise<Result<ComicInfo[]>> => {
      if (!activeWorksetId) return { success: true, data: [] };
      const result = await listComics(client, {
        worksetId: activeWorksetId,
        withs:
          mode === "reviewer"
            ? ["pinned_chapter", "pinned_chapter_assignment"]
            : ["pinned_chapter"],
        fuzzyTitle: activeFuzzyTitle || undefined,
        stages: activeStages,
        offset,
        limit,
      });
      return result;
    },
    [client, activeFuzzyTitle, activeStages, activeWorksetId],
  );

  const {
    selectedComic,
    selectedComicPinnedChapter,
    isDetailOpen,
    detailError,
    retryComicDetail,
    urlChapterId,
    detailMode,
    changeDetailMode,
    openComicDetail,
    clearComicDetail,
    navigateToWorkbench,
  } = useComicDetailHost({
    returnTo: "/comic-playground",
    showToast,
    search,
    onChangeSearch,
    onNavigateToWorkbench,
  });

  const handleUpdateWorkset = useCallback(
    async (
      id: string,
      args: { name: string; description?: string | undefined },
    ): Promise<Result<void>> => {
      const result = await updateWorkset(client, id, args);
      if (!result.success) {
        console.error("[ComicPlayground] 更新作品集失败:", result.error);
        showLocalApiFailure(result, showToast);
        return result;
      }
      showToast("作品集信息已更新", "success");
      await loadWorksets();
      return result;
    },
    [client, loadWorksets, showToast],
  );

  const handleDetailChanged = useCallback(() => {
    setComicListRefreshKey((key) => key + 1);
    retryComicDetail();
    void loadWorksets();
  }, [retryComicDetail, loadWorksets]);
  const handleCreateComic = async (args: CreateComicArgs): Promise<Result<string>> => {
    const result = await createComic(client, args);
    if (result.success) {
      await loadWorksets();
      setComicListRefreshKey((k) => k + 1);
    } else {
      console.error("[ComicPlayground] 创建漫画失败:", result.error);
      showLocalApiFailure(result, showToast);
    }
    return result;
  };

  return (
    <>
      <ComicList
        refreshKey={comicListRefreshKey}
        worksets={worksets}
        activeWorksetId={activeWorksetId}
        onChangeWorkset={setActiveWorksetId}
        onCreateWorkset={() => {
          setShowWorksetCreatorModal(true);
        }}
        onUpdateWorkset={isAdmin ? handleUpdateWorkset : undefined}
        onLoadComics={handleLoadComics}
        onComicClick={openComicDetail}
        onCreateComic={
          isAdmin && activeWorkset
            ? () => {
                setComicCreatorTeamId(teamId);
              }
            : undefined
        }
        onChangeFuzzyTitle={setActiveFuzzyTitle}
        activeFuzzyTitle={activeFuzzyTitle}
        activeUploadStatus={activeUploadStatus}
        activeTranslateStatus={activeTranslateStatus}
        activeProofreadStatus={activeProofreadStatus}
        activeTypesetStatus={activeTypesetStatus}
        activeReviewStatus={activeReviewStatus}
        activePublishStatus={activePublishStatus}
        onChangeUploadStatus={setActiveUploadStatus}
        onChangeTranslateStatus={setActiveTranslateStatus}
        onChangeProofreadStatus={setActiveProofreadStatus}
        onChangeTypesetStatus={setActiveTypesetStatus}
        onChangeReviewStatus={setActiveReviewStatus}
        onChangePublishStatus={setActivePublishStatus}
      />
      {isDetailOpen && !selectedComic && (
        <ComicDetailLoadState
          error={detailError}
          onRetry={retryComicDetail}
          onClose={clearComicDetail}
        />
      )}
      {selectedComic && (
        <ComicDetailModal
          key={selectedComic.id}
          comicInfo={selectedComic}
          pinnedChapter={selectedComicPinnedChapter}
          mode={detailMode}
          onModeChange={changeDetailMode}
          initialChapterId={urlChapterId}
          onNavigateToWorkbench={navigateToWorkbench}
          onChanged={handleDetailChanged}
          onClose={() => {
            clearComicDetail();
          }}
        />
      )}
      {comicCreatorTeamId === teamId && isAdmin && activeWorkset && (
        <ComicCreatorModal
          currWorkset={activeWorkset}
          activeMember={activeMember}
          onCreateComic={handleCreateComic}
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
