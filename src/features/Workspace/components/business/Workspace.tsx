import ComicDetailLoadState from
  "@/features/ComicPlayground/features/ComicDetailModal/components/business/ComicDetailLoadState";
import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import type { ChapterInfo, UploadProgressCallbacks } from "@/types";
import type { Result } from "@/types/utils/result";
import { showLocalApiFailure } from "@/api/util";
import { assignmentRoles, type AssignmentInfo } from "@/types/assignment";
import WorkspaceLayout from "../../layouts/WorkspaceLayout";
import ComicTranslationList from "@/features/ComcList/components/business/ComicTranslationList";
import ComicDetailModal from
  "@/features/ComicPlayground/features/ComicDetailModal";
import AnnouncementTable from "./AnnouncementTable";
import CommentChatBox from "./CommentChatBox";
import OnlineUserPopover from "./OnlineUserPopover";
import { useAppStore } from "@/store/app";
import { useToastStore } from "@/components/ui/NotificationToast/hooks";
import { fetchMyAssignmentComicCards } from "../../api/workspace";
import {
  archiveComic,
  deleteComic,
  updateComic,
} from "@/features/ComicPlayground/api/comic";
import {
  listChapters,
  createChapter,
  deleteChapter,
  updateChapter,
  exportChapter,
  importChapter,
  joinChapter,
  listChapterWorkflowRecords,
} from "@/features/ComicPlayground/api/chapter";
import {
  listPages,
  deleteChapterPages,
  allocExistingPageUpload,
} from "@/features/ComicPlayground/api/page";
import {
  deleteAssignment,
  listAssignmentsByChapter,
  upsertAssignment,
} from "@/api/assignment";
import type {
  ImportChapterArgs,
  ListChapterArgs,
  WorkflowTransition,
} from "@/features/ComicPlayground/types/chapter";
import { roleMask, type Role } from "@/types/role";
import { getUser } from "@/api/user";
import clsx from "clsx";
import { addChapterPages } from "@/features/ComicPlayground/features/ComicDetailModal/pageUpload";
import {
  useComicDetailHost,
} from "@/features/ComicPlayground/features/ComicDetailModal/hook/useComicDetailHost";
import { listComments, createComment } from "@/api/comment";
import type { CommentInfo } from "@/types/comment";
import { useOnlineUserIds, useOnlineUsers } from "@/hooks/useTeamOnline";

// 个人工作区组件，会直接放置在 WorkspacePage 中，展示个人工作区的相关内容
// 所以自身不设定高度，而是适应父组件
export default function Workspace() {
  const loginState = useAppStore((s) => s.loginState);
  const currentUserId = loginState?.userInfo.id ?? null;
  const showToast = useToastStore((s) => s.showToast);
  const [comicListRefreshKey, setComicListRefreshKey] = useState(0);
  const [comments, setComments] = useState<CommentInfo[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [mobileTab, setMobileTab] = useState(0);
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0]?.clientX ?? 0;
    touchStartYRef.current = e.touches[0]?.clientY ?? 0;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.changedTouches[0];
      if (!touch) {return;}
      const dx = touch.clientX - touchStartXRef.current;
      const dy = touch.clientY - touchStartYRef.current;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 60) {
        if (dx < 0) {setMobileTab((t) => Math.min(t + 1, 1));}
        else {setMobileTab((t) => Math.max(t - 1, 0));}
      }
    },
    [],
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
    returnTo: "/workspace",
    showToast,
  });

  const username = loginState?.userInfo.name ?? "用户";
  const selectedTeamId = useAppStore((s) => s.selectedTeamId);
  const onlineUserIds = useOnlineUserIds(selectedTeamId);
  const onlineUsers = useOnlineUsers(selectedTeamId, onlineUserIds);

  const activeMember = useMemo(() => {
    if (!selectedTeamId) {return null;}
    return (
      loginState?.memberInfos.find((m) => m.teamId === selectedTeamId) ?? null
    );
  }, [loginState?.memberInfos, selectedTeamId]);

  const isAdmin = useMemo(() => {
    return activeMember ? Boolean(activeMember.assignedAdminAt) : false;
  }, [activeMember]);

  const loadComments = useCallback(async (teamId: string) => {
    setCommentsLoading(true);
    const result = await listComments({ teamId, offset: 0, limit: 15, includes: ["user"] });
    setCommentsLoading(false);
    if (!result.success) {
      console.error("[Workspace] 加载留言失败:", result.error); // eslint-disable-line no-console
      showLocalApiFailure(result, showToast, "加载留言失败");
      return;
    }
    // eslint-disable-next-line unicorn/no-array-reverse
    setComments([...result.data].reverse());
  }, [showToast]);

  useEffect(() => {
    if (!selectedTeamId) {return;}
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadComments(selectedTeamId);
  }, [selectedTeamId, loadComments]);

  const handleSendComment = useCallback(
    async (content: string) => {
      if (!selectedTeamId || !currentUserId) {return;}
      const result = await createComment({ teamId: selectedTeamId, content });
      if (!result.success) {
        console.error("[Workspace] 发送留言失败:", result.error); // eslint-disable-line no-console
        showLocalApiFailure(result, showToast, "发送留言失败");
        return;
      }
      const newComment: CommentInfo = {
        id: result.data,
        teamId: selectedTeamId,
        userId: currentUserId,
        user: loginState?.userInfo,
        content,
        createdAt: Date.now(),
      };
      setComments((prev) => [...prev, newComment]);
    },
    [selectedTeamId, currentUserId, loginState?.userInfo, showToast],
  );

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
        limit: 20,
        includes: ["user"],
      });
    },
    [],
  );

  const handleLoadPages = useCallback(async (chapterId: string) => {
    return listPages({ chapterId });
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
        console.error("[Workspace] 加入章节分工失败:", result.error); // eslint-disable-line no-console
      }
      return result;
    },
    [],
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
        ? [...new Set([...assignmentRoles(existing), role])]
        : [role];

      const result = await upsertAssignment({
        chapterId,
        userId,
        roles: roleMask(mergedRoles),
      });

      if (!result.success) {return result;}
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
        if (!result.success) {return result;}
        return { success: true, data: undefined };
      }

      const result = await upsertAssignment({
        chapterId,
        userId,
        roles: roleMask(remainingRoles),
      });

      if (!result.success) {return result;}
      return { success: true, data: undefined };
    },
    [handleLoadAssignmentsForChapter],
  );

  const handleCreateChapter = useCallback(
    async (args: {
      comicId: string;
      subtitle?: string | undefined;
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

  const handleAllocPageUpload = useCallback(
    async (args: {
      pageId: string;
      rawIdent?: string | undefined;
      imageHash: string;
      newByteLen: number;
      extension: string;
    }) => {
      return allocExistingPageUpload(args);
    },
    [],
  );

  const handleExportChapter = useCallback(
    async (
      chapterId: string,
      options?: {
        signal?: AbortSignal | undefined;
        withRawIdent?: boolean | undefined;
      },
    ) => {
      return exportChapter(chapterId, options);
    },
    [],
  );

  const handleImportChapter = useCallback(
    async (args: ImportChapterArgs) => {
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
        logPrefix: "Workspace",
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
    async (
      args: { title: string; author: string; description?: string | undefined },
    ): Promise<Result<void>> => {
      if (!selectedComic) {
        return { success: false, error: "未选择漫画" };
      }
      const result = await updateComic(selectedComic.id, args);
      if (!result.success) {
        console.error("[Workspace] 更新漫画信息失败:", result.error); // eslint-disable-line no-console
        showLocalApiFailure(result, showToast);
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
        console.error("[Workspace] 更新章节信息失败:", result.error); // eslint-disable-line no-console
        showLocalApiFailure(result, showToast);
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
        console.error("[Workspace] 删除漫画失败:", result.error); // eslint-disable-line no-console
        return result;
      }

      clearComicDetail();
      setComicListRefreshKey((prev) => prev + 1);

      return result;
    },
    [clearComicDetail],
  );

  const handleArchiveComic = useCallback(
    async (comicId: string): Promise<Result<void>> => {
      const result = await archiveComic(comicId);
      if (!result.success) {
        console.error("[Workspace] 归档漫画失败:", result.error); // eslint-disable-line no-console
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
            {username}
          </h1>
        </div>
        {selectedTeamId && (
          <OnlineUserPopover
            onlineCount={onlineUserIds.size}
            users={onlineUsers}
          />
        )}
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
              onLoadComics={fetchMyAssignmentComicCards}
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
              onClick={() => { setMobileTab(0); }}
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
              onClick={() => { setMobileTab(1); }}
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
            className="flex-1 min-h-0 overflow-hidden relative"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* panel 0: comic list */}
            <div
              className="absolute inset-0 h-full overflow-y-auto"
              style={{ visibility: mobileTab === 0 ? "visible" : "hidden" }}
            >
              <ComicTranslationList
                key={comicListRefreshKey}
                onLoadComics={fetchMyAssignmentComicCards}
                onComicClick={openComicDetail}
              />
            </div>
            {/* panel 1: chatbox */}
            <div
              className="absolute inset-0 h-full"
              style={{ visibility: mobileTab === 1 ? "visible" : "hidden" }}
            >
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
      )}
    </div>
  );

  return (
    <>
      <WorkspaceLayout>{workspaceBody}</WorkspaceLayout>
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
          onLoadChapters={handleLoadDetailChapters}
          onLoadAssignments={handleLoadAssignmentsForChapter}
          onLoadPages={handleLoadPages}
          onLoadWorkflowRecords={listChapterWorkflowRecords}
          onResolveWorkflowRecordUser={getUser}
          onTransiteWorkflow={handleTransiteWorkflow}
          onRemoveAssignment={handleRemoveRole}
          onLoadAssignableMembers={loadAssignableMembers}
          onAddAssignment={handleAddAssignment}
          onCreateChapter={handleCreateChapter}
          onDeleteChapter={handleDeleteChapter}
          onNavigateToTranslator={navigateToTranslator}
          currentUserId={currentUserId}
          onAddPages={handleAddPages}
          onDeleteChapterPages={handleDeleteChapterPages}
          onAllocPageUpload={handleAllocPageUpload}
          onJoinChapterRole={handleJoinChapterRole}
          onImportChapter={handleImportChapter}
          onExportChapter={handleExportChapter}
          onArchiveComic={handleArchiveComic}
          onDeleteComic={handleDeleteComic}
          onUpdateComic={handleUpdateComic}
          onUpdateChapter={handleUpdateChapter}
          activeMember={detailActiveMember}
          onClose={() => { clearComicDetail(); }}
        />
      )}
    </>
  );
}
