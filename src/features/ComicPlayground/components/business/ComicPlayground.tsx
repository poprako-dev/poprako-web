import { useState, useCallback } from "react";
import { useToastStore } from "@/components/ui/NotificationToast";
import { useActiveTeam } from "@/hooks/useActiveTeam";
import { useAppStore } from "@/store/app";
import ComicList from "@/features/ComcList/components/business/ComicList";
import ComicCreatorModal from "./ComicCreatorModal";
import WorksetCreatorModal from "./WorksetCreatorModal";
import ComicDetailModal from "../../features/ComicDetailModal/components/business/ComicDetailModal";
import { listComics, createComic, deleteComic, getComic } from "../../api/comic";
import {
  listChapters,
  createChapter,
  deleteChapter,
  updateChapter,
  exportChapter,
  exportChapterLp,
  importChapter,
  joinChapter,
} from "../../api/chapter";
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
import { matchComicClientFilters } from "../../types/comic";
import { assignmentRoles, type AssignmentInfo } from "@/types/assignment";
import type { Result } from "@/types/utils/result";
import type { MemberInfo } from "@/types/member";
import type { CreateComicArgs } from "../../types/comic";
import type { ListChapterArgs, WorkflowTransition } from "../../types/chapter";
import type { Role } from "@/types/role";
import { roleMask } from "@/types/role";
import { listMembers } from "@/api/member";
import { addChapterPages } from "../../features/ComicDetailModal/pageUpload";
import { useComicDetailHost } from "../../features/ComicDetailModal/hook/useComicDetailHost";
import { useComicPlaygroundFilters } from "../../hook/useComicPlaygroundFilters";
import { useComicPlaygroundWorksets } from "../../hook/useComicPlaygroundWorksets";

export default function ComicPlayground() {
  const { activeTeamId: teamId, activeMember } = useActiveTeam();
  const currentUserId = useAppStore((s) => s.loginState?.userInfo.id ?? null);
  const { showToast } = useToastStore();

  const [comicListRefreshKey, setComicListRefreshKey] = useState(0);
  const [showComicCreatorModal, setShowComicCreatorModal] = useState(false);
  const [showWorksetCreatorModal, setShowWorksetCreatorModal] = useState(false);
  const {
    comicFilters,
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
    async (offset: number, limit: number): Promise<ComicInfo[] | string> => {
      if (!activeWorksetId) return [];
      const result = await listComics({
        worksetId: activeWorksetId,
        offset: 0,
        limit: 200,
      });
      if (!result.success) return result.error;

      const comicsWithChapter = await Promise.all(
        result.data.map(async (comic) => {
          const chapterResult = await listChapters({
            comicId: comic.id,
            offset: 0,
            limit: 1,
          });

          if (!chapterResult.success) {
            throw new Error(chapterResult.error);
          }

          return {
            comic,
            chapter: chapterResult.data[0] ?? null,
          };
        }),
      );

      const filtered = comicsWithChapter
        .filter(({ comic, chapter }) =>
          matchComicClientFilters(comic, chapter, comicFilters),
        )
        .map(({ comic }) => comic);

      return filtered.slice(offset, offset + limit);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeWorksetId, comicFilters, comicListRefreshKey],
  );

  const handleLoadLatestChapter = useCallback(
    async (comicInfo: ComicInfo): Promise<Result<ChapterInfo | null>> => {
      const result = await listChapters({
        comicId: comicInfo.id,
        offset: 0,
        limit: 1,
      });
      if (!result.success) return result;
      return { success: true, data: result.data[0] ?? null };
    },
    [],
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
    loadPinnedChapter: handleLoadLatestChapter,
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
        limit: 100,
        includes: ["user"],
      });
    },
    [],
  );

  const handleLoadAssignmentsForComic = useCallback(
    async (comicInfo: ComicInfo): Promise<Result<AssignmentInfo[]>> => {
      const pinnedResult = await handleLoadLatestChapter(comicInfo);
      if (!pinnedResult.success) {
        return pinnedResult;
      }

      const chapter = pinnedResult.data;
      if (!chapter) {
        return { success: true, data: [] };
      }

      return handleLoadAssignments(chapter.id);
    },
    [handleLoadAssignments, handleLoadLatestChapter],
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
        roleMask: roleMask(remainingRoles),
      });

      if (!result.success) return result;
      return { success: true, data: undefined };
    },
    [handleLoadAssignments],
  );

  const handleLoadPages = useCallback(async (chapterId: string) => {
    return listPages({ chapterId, offset: 0, limit: 200 });
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
        roleMask: roleMask(mergedRoles),
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
      return updateChapter(chapterId, { workflowTransition: transition });
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
    async (args: { pageId: string; fileExtension: string }) => {
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
        showToast,
        logPrefix: "ComicPlayground",
      });
    },
    [showToast],
  );

  const handleDeleteChapterPages = useCallback(
    async (chapterId: string): Promise<Result<void>> => {
      return deleteChapterPages(chapterId);
    },
    [],
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
        worksets={worksets}
        activeWorksetId={activeWorksetId}
        onChangeWorkset={setActiveWorksetId}
        onCreateWorkset={() => setShowWorksetCreatorModal(true)}
        onDeleteWorkset={handleDeleteWorkset}
        onLoadComics={handleLoadComics}
        onLoadLatestChapter={handleLoadLatestChapter}
        onLoadAssignments={handleLoadAssignmentsForComic}
        onComicClick={openComicDetail}
        onCreateComic={() => setShowComicCreatorModal(true)}
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
          initialChapterId={urlChapterId}
          onLoadChapters={handleLoadDetailChapters}
          onLoadAssignments={handleLoadAssignments}
          onLoadPages={handleLoadPages}
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
          onDeleteComic={handleDeleteComic}
          onResolveActiveMember={resolveActiveMember}
          onClose={() => clearComicDetail(true)}
        />
      )}
      {showComicCreatorModal && activeWorkset && (
        <ComicCreatorModal
          currWorkset={activeWorkset}
          onCreateComic={handleCreateComic}
          onClose={() => setShowComicCreatorModal(false)}
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
