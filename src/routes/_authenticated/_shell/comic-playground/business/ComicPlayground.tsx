import { ComicDetailLoadState } from "@/routes/_authenticated/_shell/business/comic-detail/ComicDetailLoadState";
import type { JSX } from "react";
import { useCallback, useState } from "react";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import { showLocalApiFailure } from "@/routes/business/request";
import { useActiveTeam } from "@/routes/business/session/use-active-team";
import { useAppStore } from "@/routes/business/session/session-store";
import { ComicList } from "@/routes/_authenticated/_shell/comic-playground/business/comic-list/ComicList";
import { ComicCreatorModal } from "@/routes/_authenticated/_shell/comic-playground/business/ComicCreatorModal";
import { WorksetCreatorModal } from "@/routes/_authenticated/_shell/comic-playground/business/WorksetCreatorModal";
import { ComicDetailModal } from "@/routes/_authenticated/_shell/business/comic-detail/ComicDetailModal";
import {
  archiveComic,
  createComic,
  deleteComic,
  listComics,
  updateComic,
} from "@/routes/_authenticated/business/comic/comic-request";
import { updateChapter } from "@/routes/_authenticated/business/chapter/chapter-request";
import { updateWorkset } from "@/routes/_authenticated/_shell/comic-playground/business/workset/workset-request";
import type { ComicInfo } from "@/routes/_authenticated/business/comic/comic";
import type { Result } from "@/shared/utility/result";
import type { CreateComicArgs } from "@/routes/_authenticated/business/comic/comic-input";
import { hasRole } from "@/routes/business/identity/role";
import {
  type ComicDetailSearch,
  type TranslatorDestination,
  useComicDetailHost,
} from "@/routes/_authenticated/_shell/business/comic-detail/use-comic-detail-host";
import { createDetailActions } from "@/routes/_authenticated/_shell/business/comic-detail/use-detail-actions";
import { useComicPlaygroundFilters } from "@/routes/_authenticated/_shell/comic-playground/business/use-comic-playground-filters";
import { useComicPlaygroundWorksets } from "@/routes/_authenticated/_shell/comic-playground/business/use-comic-playground-worksets";

const DETAIL_ACTIONS = createDetailActions({ logPrefix: "ComicPlayground" });

type Props = {
  search: ComicDetailSearch;
  onChangeSearch: (comicId: string | null, chapterId: string | null) => void;
  onNavigateToTranslator: (destination: TranslatorDestination) => void;
};

export function ComicPlayground({
  search,
  onChangeSearch,
  onNavigateToTranslator,
}: Props): JSX.Element {
  const { activeTeamId: teamId, activeMember } = useActiveTeam();
  const currentUserId = useAppStore((s) => s.loginState?.userInfo.id ?? null);
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
      const result = await listComics({
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
    [activeFuzzyTitle, activeStages, activeWorksetId],
  );

  const {
    selectedComic,
    selectedComicPinnedChapter,
    detailActiveMember,
    loadAssignableMembers,
    isDetailOpen,
    detailError,
    retryComicDetail,
    urlChapterId,
    openComicDetail,
    clearComicDetail,
    navigateToTranslator,
  } = useComicDetailHost({
    returnTo: "/comic-playground",
    showToast,
    search,
    onChangeSearch,
    onNavigateToTranslator,
  });

  const detailActions = DETAIL_ACTIONS;

  const handleUpdateComic = useCallback(
    async (args: {
      title: string;
      author: string;
      description?: string | undefined;
    }): Promise<Result<void>> => {
      if (!selectedComic) {
        return { success: false, error: "未选择漫画" };
      }
      const result = await updateComic(selectedComic.id, args);
      if (!result.success) {
        console.error("[ComicPlayground] 更新漫画信息失败:", result.error);
        showLocalApiFailure(result, showToast);
        return result;
      }
      showToast("漫画信息已更新", "success");
      setComicListRefreshKey((k) => k + 1);
      return result;
    },
    [selectedComic, showToast],
  );

  const handleUpdateChapter = useCallback(
    async (chapterId: string, subtitle?: string) => {
      const result = await updateChapter(chapterId, { subtitle });
      if (!result.success) {
        console.error("[ComicPlayground] 更新章节信息失败:", result.error);
        showLocalApiFailure(result, showToast);
        return result;
      }
      showToast("章节信息已更新", "success");
      return result;
    },
    [showToast],
  );

  const handleUpdateWorkset = useCallback(
    async (
      id: string,
      args: { name: string; description?: string | undefined },
    ): Promise<Result<void>> => {
      const result = await updateWorkset(id, args);
      if (!result.success) {
        console.error("[ComicPlayground] 更新作品集失败:", result.error);
        showLocalApiFailure(result, showToast);
        return result;
      }
      showToast("作品集信息已更新", "success");
      await loadWorksets();
      return result;
    },
    [loadWorksets, showToast],
  );

  const handleDeleteComic = useCallback(
    async (comicId: string): Promise<Result<void>> => {
      const result = await deleteComic(comicId);
      if (!result.success) {
        console.error("[ComicPlayground] 删除漫画失败:", result.error);
        return result;
      }

      clearComicDetail();
      await loadWorksets();
      setComicListRefreshKey((k) => k + 1);

      return result;
    },
    [clearComicDetail, loadWorksets],
  );

  const handleArchiveComic = useCallback(
    async (comicId: string): Promise<Result<void>> => {
      const result = await archiveComic(comicId);
      if (!result.success) {
        console.error("[ComicPlayground] 归档漫画失败:", result.error);
        return result;
      }

      clearComicDetail();
      await loadWorksets();
      setComicListRefreshKey((k) => k + 1);

      return result;
    },
    [clearComicDetail, loadWorksets],
  );

  const handleCreateComic = async (args: CreateComicArgs): Promise<Result<string>> => {
    const result = await createComic(args);
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
          initialChapterId={urlChapterId}
          onLoadChapters={detailActions.onLoadChapters}
          onLoadAssignments={detailActions.onLoadAssignments}
          onLoadPages={detailActions.onLoadPages}
          onLoadWorkflowRecords={detailActions.onLoadWorkflowRecords}
          onResolveWorkflowRecordUser={detailActions.onResolveWorkflowRecordUser}
          onTransiteWorkflow={detailActions.onTransiteWorkflow}
          onRemoveAssignment={detailActions.onRemoveAssignment}
          onLoadAssignableMembers={loadAssignableMembers}
          onAddAssignment={detailActions.onAddAssignment}
          onCreateChapter={detailActions.onCreateChapter}
          onDeleteChapter={detailActions.onDeleteChapter}
          onNavigateToTranslator={navigateToTranslator}
          currentUserId={currentUserId}
          onAddPages={detailActions.onAddPages}
          onDeleteChapterPages={detailActions.onDeleteChapterPages}
          onAllocPageUpload={detailActions.onAllocPageUpload}
          onJoinChapterRole={detailActions.onJoinChapterRole}
          onImportChapter={detailActions.onImportChapter}
          onExportChapter={detailActions.onExportChapter}
          onArchiveComic={handleArchiveComic}
          onDeleteComic={handleDeleteComic}
          onUpdateComic={handleUpdateComic}
          onUpdateChapter={handleUpdateChapter}
          activeMember={detailActiveMember}
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
