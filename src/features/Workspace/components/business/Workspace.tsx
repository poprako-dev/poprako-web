import { useState, useCallback, useMemo } from "react";
import type { ChapterInfo, UploadProgressCallbacks } from "@/types";
import type { Result } from "@/types/utils/result";
import { assignmentRoles, type AssignmentInfo } from "@/types/assignment";
import type { MemberInfo } from "@/types/member";
import WorkspaceLayout from "../../layouts/WorkspaceLayout";
import EmbeddedComicList from "@/features/ComcList/components/business/EmbeddedComicList";
import ComicDetailModal from
  "@/features/ComicPlayground/features/ComicDetailModal/components/business/ComicDetailModal";
import { useAppStore } from "@/store/app";
import { useToastStore } from "@/components/ui/NotificationToast/hooks";
import {
  fetchMyComics,
  fetchLatestChapter,
  fetchComicAssignments,
} from "../../api/workspace";
import { deleteComic, getComic } from "@/features/ComicPlayground/api/comic";
import {
  listChapters,
  createChapter,
  deleteChapter,
  updateChapter,
  exportChapter,
  exportChapterLp,
  importChapter,
  joinChapter,
} from "@/features/ComicPlayground/api/chapter";
import {
  listPages,
  deleteChapterPages,
  reserveExistingPageUpload,
} from "@/features/ComicPlayground/api/page";
import {
  deleteAssignment,
  listAssignmentsByChapter,
  upsertAssignment,
} from "@/api/assignment";
import type { ListChapterArgs, WorkflowTransition } from "@/features/ComicPlayground/types/chapter";
import { roleMask, type Role } from "@/types/role";
import { listMembers } from "@/api/member";
import clsx from "clsx";
import { addChapterPages } from "@/features/ComicPlayground/features/ComicDetailModal/pageUpload";
import { useComicDetailHost } from "@/features/ComicPlayground/features/ComicDetailModal/hook/useComicDetailHost";

// 个人工作区组件，会直接放置在 WorkspacePage 中，展示个人工作区的相关内容
// 所以自身不设定高度，而是适应父组件
export default function Workspace() {
  const loginState = useAppStore((s) => s.loginState);
  const currentUserId = loginState?.userInfo.id ?? null;
  const { showToast } = useToastStore();
  const [comicListRefreshKey, setComicListRefreshKey] = useState(0);
  const {
    selectedComic,
    selectedComicPinnedChapter,
    urlChapterId,
    openComicDetail,
    clearComicDetail,
    navigateToTranslator,
  } = useComicDetailHost({
    returnTo: "/workspace",
    logPrefix: "Workspace",
    showToast,
    restoreComic: getComic,
    loadPinnedChapter: fetchLatestChapter,
  });

  const userName = loginState?.userInfo.name ?? "用户";
  const selectedComicTeamId = selectedComic?.workset?.teamId ?? null;
  const selectedComicActiveMember = useMemo(() => {
    const teamId = selectedComicTeamId;
    if (!teamId) return null;
    return loginState?.memberInfos.find((member) => member.teamId === teamId) ?? null;
  }, [loginState?.memberInfos, selectedComicTeamId]);

  const resolveActiveMember = useCallback(() => {
    return selectedComicActiveMember;
  }, [selectedComicActiveMember]);

  const handleLoadDetailChapters = useCallback(
    async (args: ListChapterArgs): Promise<Result<ChapterInfo[]>> => {
      return listChapters(args);
    },
    [],
  );

  const handleLoadAssignmentsForChapter = useCallback(
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

  const handleLoadPages = useCallback(async (chapterId: string) => {
    return listPages({ chapterId, offset: 0, limit: 200 });
  }, []);

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
        console.error("[Workspace] 加入章节分工失败:", result.error);
      }
      return result;
    },
    [],
  );

  const handleLoadAssignableMembers = useCallback(
    async (chapterId: string): Promise<Result<MemberInfo[]>> => {
      void chapterId;
      if (!selectedComicTeamId) {
        return { success: true, data: [] };
      }

      return listMembers({
        teamId: selectedComicTeamId,
        offset: 0,
        limit: 200,
        includes: ["user"],
      });
    },
    [selectedComicTeamId],
  );

  const handleAddAssignment = useCallback(
    async (
      chapterId: string,
      userId: string,
      role: Role,
    ): Promise<Result<void>> => {
      const assignmentResult = await handleLoadAssignmentsForChapter(chapterId);
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
    [handleLoadAssignmentsForChapter],
  );

  const handleRemoveRole = useCallback(
    async (chapterId: string, userId: string, role: Role): Promise<Result<void>> => {
      const assignmentResult = await handleLoadAssignmentsForChapter(chapterId);
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
    [handleLoadAssignmentsForChapter],
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
        logPrefix: "Workspace",
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
        console.error("[Workspace] 删除漫画失败:", result.error);
        return result;
      }

      clearComicDetail();
      setComicListRefreshKey((prev) => prev + 1);

      return result;
    },
    [clearComicDetail],
  );

  const workspaceBody = (
    <div
      className={clsx("flex h-full min-h-0 min-w-0 flex-col overflow-x-hidden")}
    >
      <div
        className={clsx(
          "mb-3 flex flex-col",
          "sm:flex-row sm:items-end sm:justify-between sm:gap-4",
        )}
      >
        <div>
          <p className={clsx("text-md text-slate-400")}>欢迎回来</p>
          <h1 className={clsx("mt-0.5 ml-1 text-3xl font-bold text-slate-700")}>
            {userName}
          </h1>
        </div>
      </div>

      <div className={clsx("flex-1 min-h-0 min-w-0 overflow-x-hidden")}>
        <EmbeddedComicList
          key={comicListRefreshKey}
          mode="translator"
          onLoadComics={fetchMyComics}
          onLoadLatestChapter={fetchLatestChapter}
          onLoadAssignments={fetchComicAssignments}
          onComicClick={openComicDetail}
        />
      </div>
    </div>
  );

  return (
    <>
      <WorkspaceLayout>{workspaceBody}</WorkspaceLayout>
      {selectedComic && (
        <ComicDetailModal
          key={selectedComic.id}
          comicInfo={selectedComic}
          pinnedChapter={selectedComicPinnedChapter}
          initialChapterId={urlChapterId}
          onLoadChapters={handleLoadDetailChapters}
          onLoadAssignments={handleLoadAssignmentsForChapter}
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
    </>
  );
}
