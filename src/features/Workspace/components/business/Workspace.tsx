import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import type { ChapterInfo, UploadProgressCallbacks } from "@/types";
import type { Result } from "@/types/utils/result";
import { assignmentRoles, type AssignmentInfo } from "@/types/assignment";
import type { MemberInfo } from "@/types/member";
import WorkspaceLayout from "../../layouts/WorkspaceLayout";
import ComicTranslationList from "@/features/ComcList/components/business/ComicTranslationList";
import ComicDetailModal from "@/features/ComicPlayground/features/ComicDetailModal/components/business/ComicDetailModal";
import AnnouncementTable from "./AnnouncementTable";
import CommentChatBox from "./CommentChatBox";
import { useAppStore } from "@/store/app";
import { useToastStore } from "@/components/ui/NotificationToast/hooks";
import { fetchMyComics, fetchLatestChapter } from "../../api/workspace";
import { deleteComic, getComic, updateComic } from "@/features/ComicPlayground/api/comic";
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
import type {
  ListChapterArgs,
  WorkflowTransition,
} from "@/features/ComicPlayground/types/chapter";
import { roleMask, type Role } from "@/types/role";
import { listMembers } from "@/api/member";
import clsx from "clsx";
import { addChapterPages } from "@/features/ComicPlayground/features/ComicDetailModal/pageUpload";
import { useComicDetailHost } from "@/features/ComicPlayground/features/ComicDetailModal/hook/useComicDetailHost";
import { listComments, createComment } from "@/api/comment";
import type { CommentInfo } from "@/types/comment";

// 个人工作区组件，会直接放置在 WorkspacePage 中，展示个人工作区的相关内容
// 所以自身不设定高度，而是适应父组件
export default function Workspace() {
  const loginState = useAppStore((s) => s.loginState);
  const currentUserId = loginState?.userInfo.id ?? null;
  const { showToast } = useToastStore();
  const [comicListRefreshKey, setComicListRefreshKey] = useState(0);
  const [comments, setComments] = useState<CommentInfo[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [mobileTab, setMobileTab] = useState(0);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      const dy = e.changedTouches[0].clientY - touchStartY.current;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 60) {
        if (dx < 0) setMobileTab((t) => Math.min(t + 1, 1));
        else setMobileTab((t) => Math.max(t - 1, 0));
      }
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
    returnTo: "/workspace",
    logPrefix: "Workspace",
    showToast,
    restoreComic: getComic,
    loadPinnedChapter: fetchLatestChapter,
  });

  const userName = loginState?.userInfo.name ?? "用户";
  const selectedTeamId = useAppStore((s) => s.selectedTeamId);
  const selectedComicTeamId = selectedComic?.workset?.teamId ?? null;

  const activeMember = useMemo(() => {
    if (!selectedTeamId) return null;
    return (
      loginState?.memberInfos.find((m) => m.teamId === selectedTeamId) ?? null
    );
  }, [loginState?.memberInfos, selectedTeamId]);

  const isAdmin = useMemo(() => {
    return activeMember ? !!activeMember.assignedAdminAt : false;
  }, [activeMember]);

  const loadComments = useCallback(async (teamId: string) => {
    setCommentsLoading(true);
    const result = await listComments({ teamId, offset: 0, limit: 50 });
    setCommentsLoading(false);
    if (!result.success) {
      console.error("[Workspace] 加载留言失败:", result.error);
      showToast("加载留言失败", "error");
      return;
    }
    setComments(result.data);
  }, [showToast]);

  useEffect(() => {
    if (!selectedTeamId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadComments(selectedTeamId);
  }, [selectedTeamId, loadComments]);

  const handleSendComment = useCallback(
    async (content: string) => {
      if (!selectedTeamId) return;
      const result = await createComment({ teamId: selectedTeamId, content });
      if (!result.success) {
        console.error("[Workspace] 发送留言失败:", result.error);
        showToast("发送留言失败", "error");
        return;
      }
      await loadComments(selectedTeamId);
    },
    [selectedTeamId, loadComments, showToast],
  );

  const resolveActiveMember = useCallback(() => {
    // 1. 优先匹配漫画所属的作品集团队
    if (selectedComicTeamId) {
      const member = loginState?.memberInfos.find(
        (m) => m.teamId === selectedComicTeamId,
      );
      if (member) return member;
    }
    // 2. fallback：全局选中的团队
    if (selectedTeamId) {
      const member = loginState?.memberInfos.find(
        (m) => m.teamId === selectedTeamId,
      );
      if (member) return member;
    }
    // 3. 最终兜底：任一可用成员身份
    return loginState?.memberInfos[0] ?? null;
  }, [loginState?.memberInfos, selectedComicTeamId, selectedTeamId]);

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
    async (
      chapterId: string,
      args: { role: Role; keyword?: string; offset: number; limit: number },
    ): Promise<Result<MemberInfo[]>> => {
      void chapterId;
      if (!selectedComicTeamId) {
        return { success: true, data: [] };
      }

      return listMembers({
        teamId: selectedComicTeamId,
        offset: args.offset,
        limit: args.limit,
        includes: ["user"],
        userNicknameKeyword: args.keyword,
        role: roleMask([args.role]),
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
        roles: roleMask(mergedRoles),
      });

      if (!result.success) return result;
      return { success: true, data: undefined };
    },
    [handleLoadAssignmentsForChapter],
  );

  const handleRemoveRole = useCallback(
    async (
      chapterId: string,
      userId: string,
      role: Role,
    ): Promise<Result<void>> => {
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
        roles: roleMask(remainingRoles),
      });

      if (!result.success) return result;
      return { success: true, data: undefined };
    },
    [handleLoadAssignmentsForChapter],
  );

  const handleCreateChapter = useCallback(
    async (args: {
      comicId: string;
      subtitle?: string;
    }): Promise<Result<string>> => {
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
    async (args: {
      chapterId: string;
      content: string;
      format: "json" | "lp";
    }) => {
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

  const handleUpdateComic = useCallback(
    async (args: { title: string; author: string; description?: string }) => {
      if (!selectedComic) {
        return { success: false, error: "未选择漫画" } as Result<void>;
      }
      const result = await updateComic(selectedComic.id, args);
      if (!result.success) {
        console.error("[Workspace] 更新漫画信息失败:", result.error);
        showToast(result.error, "error");
        return result;
      }
      showToast("漫画信息已更新", "success");
      setComicListRefreshKey((prev) => prev + 1);
      return result;
    },
    [selectedComic, showToast],
  );

  const handleUpdateChapter = useCallback(
    async (chapterId: string, subtitle?: string) => {
      const result = await updateChapter(chapterId, { subtitle });
      if (!result.success) {
        console.error("[Workspace] 更新章节信息失败:", result.error);
        showToast(result.error, "error");
        return result;
      }
      showToast("章节信息已更新", "success");
      return result;
    },
    [showToast],
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

      {selectedTeamId && (
        <AnnouncementTable
          teamId={selectedTeamId}
          teamName={activeMember?.team?.name ?? ""}
          isAdmin={isAdmin}
        />
      )}

      {/* Desktop: side-by-side */}
      <div
        className={clsx(
          "hidden md:flex",
          "flex-1 min-h-0 min-w-0 flex-row gap-4",
        )}
      >
        {/* 任务列表区域 */}
        <div
          className={clsx(
            "flex-1 min-h-0 min-w-0 overflow-hidden",
            "flex flex-col",
          )}
        >
          <div
            className={clsx(
              "flex items-center gap-2 px-1 mb-2 shrink-0",
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
            <span className="text-sm font-semibold text-slate-500 tracking-tight">
              任务列表
            </span>
            <div className="flex-1 h-0.5 bg-slate-200" />
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            <ComicTranslationList
              key={comicListRefreshKey}
              onLoadComics={fetchMyComics}
              onLoadLatestChapter={fetchLatestChapter}
              onComicClick={openComicDetail}
            />
          </div>
        </div>
        {/* 留言板区域 */}
        {selectedTeamId && (
          <div
            className={clsx(
              "w-64 shrink-0 min-h-0",
              "flex flex-col",
            )}
          >
            <div
              className={clsx(
                "flex items-center gap-2 px-1 mb-2 shrink-0",
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
              <span className="text-sm font-semibold text-slate-500 tracking-tight">
                留言板
              </span>
              <div className="flex-1 h-0.5 bg-stone-200" />
            </div>
            <div
              className={clsx(
                "flex-1 min-h-0",
                "rounded-md border border-border/50",
                "overflow-hidden",
              )}
            >
              <CommentChatBox
                comments={comments}
                loading={commentsLoading}
                onSend={handleSendComment}
              />
            </div>
          </div>
        )}
      </div>

      {/* Mobile: swipeable tabs */}
      {selectedTeamId && (
        <div className="md:hidden flex-1 min-h-0 min-w-0 flex flex-col">
          {/* tab bar */}
          <div
            className={clsx(
              "flex items-center gap-4 px-1 mb-2 shrink-0",
            )}
          >
            <button
              type="button"
              onClick={() => setMobileTab(0)}
              className="flex items-center gap-2"
            >
              <span
                className={clsx(
                  "w-1.5 h-1.5 rounded-full shrink-0",
                  mobileTab === 0 ? "bg-slate-500" : "bg-slate-300",
                )}
              />
              <span
                className={clsx(
                  "text-sm font-semibold tracking-tight",
                  mobileTab === 0
                    ? "text-slate-600"
                    : "text-slate-400",
                )}
              >
                任务列表
              </span>
            </button>
            <button
              type="button"
              onClick={() => setMobileTab(1)}
              className="flex items-center gap-2"
            >
              <span
                className={clsx(
                  "w-1.5 h-1.5 rounded-full shrink-0",
                  mobileTab === 1 ? "bg-slate-500" : "bg-slate-300",
                )}
              />
              <span
                className={clsx(
                  "text-sm font-semibold tracking-tight",
                  mobileTab === 1
                    ? "text-slate-600"
                    : "text-slate-400",
                )}
              >
                留言板
              </span>
            </button>
            <div className="flex-1 h-0.5 bg-stone-200" />
          </div>

          {/* swipeable content */}
          <div
            className="flex-1 min-h-0 overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className="flex h-full transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${mobileTab * 100}%)` }}
            >
              {/* panel 0: comic list */}
              <div className="w-full shrink-0 h-full overflow-y-auto">
                <ComicTranslationList
                  key={comicListRefreshKey}
                  onLoadComics={fetchMyComics}
                  onLoadLatestChapter={fetchLatestChapter}
                  onComicClick={openComicDetail}
                />
              </div>
              {/* panel 1: chatbox */}
              <div className="w-full shrink-0 h-full">
                <div
                  className={clsx(
                    "h-full",
                    "rounded-md border border-border/50",
                    "overflow-hidden",
                  )}
                >
                  <CommentChatBox
                    comments={comments}
                    loading={commentsLoading}
                    onSend={handleSendComment}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
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
          onUpdateComic={handleUpdateComic}
          onUpdateChapter={handleUpdateChapter}
          onResolveActiveMember={resolveActiveMember}
          onClose={() => clearComicDetail(true)}
        />
      )}
    </>
  );
}
