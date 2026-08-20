import { useState, useCallback } from "react";
import { useToastStore } from "@/components/ui/NotificationToast";
import { useActiveTeam } from "@/hooks/useActiveTeam";
import { useAppStore } from "@/store/app";
import ComicList from "@/features/ComcList/components/business/ComicList";
import ComicCreatorModal from "./ComicCreatorModal";
import WorksetCreatorModal from "./WorksetCreatorModal";
import ComicDetailModal from "../../features/ComicDetailModal/components/business/ComicDetailModal";
import {
  archiveComic,
  listComics,
  createComic,
  deleteComic,
  getComic,
  updateComic,
} from "../../api/comic";
import {
  listChapters,
  createChapter,
  deleteChapter,
  updateChapter,
  exportChapter,
  exportChapterLp,
  importChapter,
  joinChapter,
  listChapterWorkflowRecords,
} from "../../api/chapter";
import { updateWorkset } from "../../api/workset";
import {
  listPages,
  deleteChapterPages,
  reserveExistingPageUpload,
} from "../../api/page";
import {
  deleteAssignment,
  listAssignmentsByChapter,
  upsertAssignment,
} from "@/api/assignment";
import type { ComicInfo, ChapterInfo, UploadProgressCallbacks } from "@/types";
import { assignmentRoles, type AssignmentInfo } from "@/types/assignment";
import type { Result } from "@/types/utils/result";
import type { MemberInfo } from "@/types/member";
import type { CreateComicArgs } from "../../types/comic";
import type { ListChapterArgs, WorkflowTransition } from "../../types/chapter";
import type { Role } from "@/types/role";
import { roleMask, hasRole } from "@/types/role";
import { listMembers } from "@/api/member";
import { getUser } from "@/api/user";
import { addChapterPages } from "../../features/ComicDetailModal/pageUpload";
import { useComicDetailHost } from "../../features/ComicDetailModal/hook/useComicDetailHost";
import { useComicPlaygroundFilters } from "../../hook/useComicPlaygroundFilters";
import { useComicPlaygroundWorksets } from "../../hook/useComicPlaygroundWorksets";

export default function ComicPlayground() {
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
    handleDeleteWorkset,
    handleCreateWorkset,
  } = useComicPlaygroundWorksets({ teamId, showToast });

  const handleLoadComics = useCallback(
    async (
      offset: number,
      limit: number,
      mode: "translator" | "reviewer",
    ): Promise<ComicInfo[] | string> => {
      if (!activeWorksetId) return [];
      const result = await listComics({
        worksetId: activeWorksetId,
        withs: mode === "reviewer"
          ? ["pinned_chapter", "pinned_chapter_assignment"]
          : ["pinned_chapter"],
        fuzzyTitle: activeFuzzyTitle || undefined,
        stages: activeStages,
        offset,
        limit,
      });
      if (!result.success) return result.error;

      return result.data;
    },
    [activeFuzzyTitle, activeStages, activeWorksetId],
  );

  const {
    selectedComic,
    selectedComicPinnedChapter,
    urlChapterId,
    openComicDetail,
    clearComicDetail,
    navigateToTranslator,
  } = useComicDetailHost({
    returnTo: "/comic-playground",
    logPrefix: "ComicPlayground",
    showToast,
    restoreComic: getComic,
  });

  const handleLoadDetailChapters = useCallback(
    async (args: ListChapterArgs): Promise<Result<ChapterInfo[]>> => {
      return listChapters(args);
    },
    [],
  );

  const handleLoadAssignments = useCallback(
    async (chapterId: string): Promise<Result<AssignmentInfo[]>> => {
      return listAssignmentsByChapter({
        chapterId,
        offset: 0,
        limit: 20,
        includes: ["user"],
      });
    },
    [],
  );

  const handleRemoveRole = useCallback(
    async (chapterId: string, userId: string, role: Role): Promise<Result<void>> => {
      const assignmentResult = await handleLoadAssignments(chapterId);
      if (!assignmentResult.success) {
        return assignmentResult;
      }

      const target = assignmentResult.data.find(
        (assignment) => assignment.userId === userId,
      );
      if (!target) {
        return { success: false, error: "未找到对应分工记录" };
      }

      const remainingRoles = assignmentRoles(target).filter((r) => r !== role);

      if (remainingRoles.length === 0) {
        const result = await deleteAssignment(target.id);
        if (!result.success) return result;
        return { success: true, data: undefined };
      }

      const result = await upsertAssignment({
        chapterId,
        userId,
        roles: roleMask(remainingRoles),
      });

      if (!result.success) return result;
      return { success: true, data: undefined };
    },
    [handleLoadAssignments],
  );

  const handleLoadPages = useCallback(async (chapterId: string) => {
    return listPages({ chapterId });
  }, []);

  const handleLoadAssignableMembers = useCallback(
    async (
      chapterId: string,
      args: { role: Role; keyword?: string; offset: number; limit: number },
    ): Promise<Result<MemberInfo[]>> => {
      void chapterId;
      if (!teamId) {
        return { success: true, data: [] };
      }

      return listMembers({
        teamId,
        offset: args.offset,
        limit: args.limit,
        includes: ["user"],
        userNicknameKeyword: args.keyword,
        role: roleMask([args.role]),
      });
    },
    [teamId],
  );

  const handleAddAssignment = useCallback(
    async (
      chapterId: string,
      userId: string,
      role: Role,
    ): Promise<Result<void>> => {
      const assignmentResult = await handleLoadAssignments(chapterId);
      if (!assignmentResult.success) {
        return assignmentResult;
      }

      const existing = assignmentResult.data.find(
        (assignment) => assignment.userId === userId,
      );
      const mergedRoles = existing
        ? Array.from(new Set([...assignmentRoles(existing), role]))
        : [role];

      const result = await upsertAssignment({
        chapterId,
        userId,
        roles: roleMask(mergedRoles),
      });

      if (!result.success) return result;
      return { success: true, data: undefined };
    },
    [handleLoadAssignments],
  );

  const handleTransiteWorkflow = useCallback(
    async (
      chapterId: string,
      transition: WorkflowTransition,
    ): Promise<Result<void>> => {
      const isRevert = transition.includes("_revert");
      return updateChapter(
        chapterId,
        isRevert
          ? { revertTransition: transition }
          : { workflowTransition: transition },
      );
    },
    [],
  );

  const handleJoinChapterRole = useCallback(
    async (chapterId: string, role: Role): Promise<Result<void>> => {
      const result = await joinChapter(chapterId, roleMask([role]));
      if (!result.success) {
        console.error("[ComicPlayground] 加入章节分工失败:", result.error);
      }
      return result;
    },
    [],
  );

  const handleReservePageUpload = useCallback(
    async (args: {
      pageId: string;
      imageHash: string;
      newByteLen: number;
      extension: string;
    }) => {
      return reserveExistingPageUpload(args);
    },
    [],
  );

  const handleExportChapter = useCallback(
    async (chapterId: string, options?: { signal?: AbortSignal }) => {
      return exportChapter(chapterId, options);
    },
    [],
  );

  const handleExportChapterLp = useCallback(
    async (chapterId: string, options?: { signal?: AbortSignal }) => {
      return exportChapterLp(chapterId, options);
    },
    [],
  );

  const handleImportChapter = useCallback(
    async (args: { chapterId: string; content: string; format: "json" | "lp" }) => {
      return importChapter(args);
    },
    [],
  );

  const handleAddPages = useCallback(
    async (
      chapterId: string,
      files: File[],
      callbacks?: UploadProgressCallbacks,
    ) => {
      return addChapterPages({
        chapterId,
        files,
        callbacks,
        logPrefix: "ComicPlayground",
      });
    },
    [],
  );

  const handleDeleteChapterPages = useCallback(
    async (chapterId: string): Promise<Result<void>> => {
      return deleteChapterPages(chapterId);
    },
    [],
  );

  const handleUpdateComic = useCallback(
    async (args: { title: string; author: string; description?: string }) => {
      if (!selectedComic) {
        return { success: false, error: "未选择漫画" } as Result<void>;
      }
      const result = await updateComic(selectedComic.id, args);
      if (!result.success) {
        console.error("[ComicPlayground] 更新漫画信息失败:", result.error);
        showToast(result.error, "error");
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
        showToast(result.error, "error");
        return result;
      }
      showToast("章节信息已更新", "success");
      return result;
    },
    [showToast],
  );

  const handleUpdateWorkset = useCallback(
    async (id: string, args: { name: string; description?: string }) => {
      const result = await updateWorkset(id, args);
      if (!result.success) {
        console.error("[ComicPlayground] 更新作品集失败:", result.error);
        showToast(result.error, "error");
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

      clearComicDetail(true);
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

      clearComicDetail(true);
      await loadWorksets();
      setComicListRefreshKey((k) => k + 1);

      return result;
    },
    [clearComicDetail, loadWorksets],
  );

  const handleCreateChapter = useCallback(
    async (args: { comicId: string; subtitle?: string }): Promise<Result<string>> => {
      return createChapter(args);
    },
    [],
  );

  const handleDeleteChapter = useCallback(
    async (chapterId: string): Promise<Result<void>> => {
      return deleteChapter(chapterId);
    },
    [],
  );


  const handleCreateComic = async (
    args: CreateComicArgs,
  ): Promise<Result<string>> => {
    const result = await createComic(args);
    if (!result.success) {
      console.error("[ComicPlayground] 创建漫画失败:", result.error);
      showToast(result.error, "error");
    } else {
      await loadWorksets();
      setComicListRefreshKey((k) => k + 1);
    }
    return result;
  };

  const resolveActiveMember = useCallback(() => {
    return activeMember;
  }, [activeMember]);

  return (
    <>
      <ComicList
        refreshKey={comicListRefreshKey}
        worksets={worksets}
        activeWorksetId={activeWorksetId}
        onChangeWorkset={setActiveWorksetId}
        onCreateWorkset={() => setShowWorksetCreatorModal(true)}
        onDeleteWorkset={handleDeleteWorkset}
        onUpdateWorkset={isAdmin ? handleUpdateWorkset : undefined}
        onLoadComics={handleLoadComics}
        onComicClick={openComicDetail}
        onCreateComic={isAdmin ? () => setComicCreatorTeamId(teamId) : undefined}
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
      {selectedComic && (
        <ComicDetailModal
          key={selectedComic.id}
          comicInfo={selectedComic}
          pinnedChapter={selectedComicPinnedChapter}
          pinnedChapterAssignments={selectedComic.pinnedChapterAssignments}
          initialChapterId={urlChapterId}
          onLoadChapters={handleLoadDetailChapters}
          onLoadAssignments={handleLoadAssignments}
          onLoadPages={handleLoadPages}
          onLoadWorkflowRecords={listChapterWorkflowRecords}
          onResolveWorkflowRecordUser={getUser}
          onTransiteWorkflow={handleTransiteWorkflow}
          onRemoveAssignment={handleRemoveRole}
          onLoadAssignableMembers={handleLoadAssignableMembers}
          onAddAssignment={handleAddAssignment}
          onCreateChapter={handleCreateChapter}
          onDeleteChapter={handleDeleteChapter}
          onNavigateToTranslator={navigateToTranslator}
          currentUserId={currentUserId}
          onAddPages={handleAddPages}
          onDeleteChapterPages={handleDeleteChapterPages}
          onReservePageUpload={handleReservePageUpload}
          onJoinChapterRole={handleJoinChapterRole}
          onImportChapter={handleImportChapter}
          onExportChapter={handleExportChapter}
          onExportChapterLp={handleExportChapterLp}
          onArchiveComic={handleArchiveComic}
          onDeleteComic={handleDeleteComic}
          onUpdateComic={handleUpdateComic}
          onUpdateChapter={handleUpdateChapter}
          onResolveActiveMember={resolveActiveMember}
          onClose={() => clearComicDetail(true)}
        />
      )}
      {comicCreatorTeamId === teamId && isAdmin && activeWorkset && (
        <ComicCreatorModal
          currWorkset={activeWorkset}
          onCreateComic={handleCreateComic}
          onClose={() => setComicCreatorTeamId(null)}
        />
      )}
      {showWorksetCreatorModal && teamId && (
        <WorksetCreatorModal
          teamId={teamId}
          onCreateWorkset={handleCreateWorkset}
          onClose={() => setShowWorksetCreatorModal(false)}
        />
      )}
    </>
  );
}
