import { ComicDetailLoadState } from "@/routes/_authenticated/_shell/business/comic-detail/ComicDetailLoadState";
import type { JSX } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Result } from "@/shared/utility/result";
import { showLocalApiFailure } from "@/routes/business/request";
import { WorkspaceLayout } from "@/routes/_authenticated/_shell/workspace/business/WorkspaceLayout";
import { ComicDetailModal } from "@/routes/_authenticated/_shell/business/comic-detail/ComicDetailModal";
import { WorkspacePanel } from "@/routes/_authenticated/_shell/workspace/business/WorkspacePanel";
import { useAppStore } from "@/routes/business/session/session-store";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import {
  archiveComic,
  deleteComic,
  updateComic,
} from "@/routes/_authenticated/business/comic/comic-request";
import { updateChapter } from "@/routes/_authenticated/business/chapter/chapter-request";
import {
  type ComicDetailSearch,
  type TranslatorDestination,
  useComicDetailHost,
} from "@/routes/_authenticated/_shell/business/comic-detail/use-comic-detail-host";
import { createDetailActions } from "@/routes/_authenticated/_shell/business/comic-detail/use-detail-actions";
import {
  createComment,
  listComments,
} from "@/routes/_authenticated/_shell/workspace/business/comment/comment-request";
import type { CommentInfo } from "@/routes/_authenticated/_shell/workspace/business/comment/comment";
import {
  useOnlineUserIds,
  useOnlineUsers,
} from "@/routes/_authenticated/_shell/workspace/business/online/use-online-users";

const DETAIL_ACTIONS = createDetailActions({ logPrefix: "Workspace" });

type Props = {
  search: ComicDetailSearch;
  onChangeSearch: (comicId: string | null, chapterId: string | null) => void;
  onNavigateToTranslator: (destination: TranslatorDestination) => void;
};

// 个人工作区组件，会直接放置在 WorkspacePage 中，展示个人工作区的相关内容
// 所以自身不设定高度，而是适应父组件
export function Workspace({ search, onChangeSearch, onNavigateToTranslator }: Props): JSX.Element {
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

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    if (!touch) return;
    const dx = touch.clientX - touchStartXRef.current;
    const dy = touch.clientY - touchStartYRef.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 60) {
      if (dx < 0) setMobileTab((t) => Math.min(t + 1, 1));
      else setMobileTab((t) => Math.max(t - 1, 0));
    }
  }, []);
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
    search,
    onChangeSearch,
    onNavigateToTranslator,
  });

  const username = loginState?.userInfo.name ?? null;
  const selectedTeamId = useAppStore((s) => s.selectedTeamId);
  const onlineUserIds = useOnlineUserIds(selectedTeamId);
  const onlineUsers = useOnlineUsers(selectedTeamId, onlineUserIds);

  const activeMember = useMemo(() => {
    if (!selectedTeamId) return null;
    return loginState?.memberInfos.find((m) => m.teamId === selectedTeamId) ?? null;
  }, [loginState?.memberInfos, selectedTeamId]);

  const isAdmin = useMemo(() => {
    return activeMember ? Boolean(activeMember.assignedAdminAt) : false;
  }, [activeMember]);

  const loadComments = useCallback(
    async (teamId: string) => {
      setCommentsLoading(true);
      const result = await listComments({
        teamId,
        offset: 0,
        limit: 15,
        includes: ["user"],
      });
      setCommentsLoading(false);
      if (!result.success) {
        console.error("[Workspace] 加载留言失败:", result.error);
        showLocalApiFailure(result, showToast, "加载留言失败");
        return;
      }
      setComments([...result.data].reverse());
    },
    [showToast],
  );

  useEffect(() => {
    if (!selectedTeamId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadComments(selectedTeamId);
  }, [selectedTeamId, loadComments]);

  const handleSendComment = useCallback(
    async (content: string) => {
      if (!selectedTeamId || !currentUserId) return;
      const result = await createComment({ teamId: selectedTeamId, content });
      if (!result.success) {
        console.error("[Workspace] 发送留言失败:", result.error);
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
        console.error("[Workspace] 更新漫画信息失败:", result.error);
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
        console.error("[Workspace] 更新章节信息失败:", result.error);
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
        console.error("[Workspace] 删除漫画失败:", result.error);
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
        console.error("[Workspace] 归档漫画失败:", result.error);
        return result;
      }

      clearComicDetail();
      setComicListRefreshKey((prev) => prev + 1);

      return result;
    },
    [clearComicDetail],
  );

  const workspaceBody = (
    <WorkspacePanel
      username={username}
      selectedTeamId={selectedTeamId}
      team={activeMember?.team ? { id: activeMember.team.id, name: activeMember.team.name } : null}
      isAdmin={isAdmin}
      onlineCount={onlineUserIds.userIds.size}
      onlineUsers={onlineUsers.users}
      onlineStatus={onlineUsers.status}
      comments={comments}
      commentsLoading={commentsLoading}
      onSendComment={handleSendComment}
      mobileTab={mobileTab}
      onChangeMobileTab={setMobileTab}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      comicListRefreshKey={comicListRefreshKey}
      onComicClick={openComicDetail}
    />
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
    </>
  );
}
