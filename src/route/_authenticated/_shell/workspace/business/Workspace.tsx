import { useReadySession } from "@/route/business/session/ready-session";
import { hasRole } from "@/route/business/identity/role";
import { createComment } from "@/api/comment";
import { ComicDetailLoadState } from "@/route/_authenticated/_shell/business/comic-detail/ComicDetailLoadState";
import type { JSX } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { showLocalApiFailure } from "@/route/business/request-error";
import { WorkspaceLayout } from "@/route/_authenticated/_shell/workspace/business/WorkspaceLayout";
import { ComicDetailModal } from "@/route/_authenticated/_shell/business/comic-detail/ComicDetailModal";
import { WorkspacePanel } from "@/route/_authenticated/_shell/workspace/business/WorkspacePanel";
import { useAppStore } from "@/route/business/session/session-store";
import { useApiClient } from "@/route/business/api-context";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import {
  type ComicDetailSearch,
  type TranslatorDestination,
  useComicDetailHost,
} from "@/route/_authenticated/_shell/business/comic-detail/use-comic-detail-host";
import { listComments } from "@/route/_authenticated/_shell/workspace/business/comment/comment-request";
import type { CommentInfo } from "@/route/_authenticated/_shell/workspace/business/comment/comment";
import {
  useOnlineUserIds,
  useOnlineUsers,
} from "@/route/_authenticated/_shell/workspace/business/online/use-online-users";

type Props = {
  search: ComicDetailSearch;
  onChangeSearch: (comicId: string | null, chapterId: string | null) => void;
  onNavigateToTranslator: (destination: TranslatorDestination) => void;
};

// 个人工作区组件，会直接放置在 WorkspacePage 中，展示个人工作区的相关内容
// 所以自身不设定高度，而是适应父组件
export function Workspace({ search, onChangeSearch, onNavigateToTranslator }: Props): JSX.Element {
  const client = useApiClient();
  const loginState = useReadySession();
  const currentUserId = loginState.userInfo.id;
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

  const username = loginState.userInfo.name;
  const selectedTeamId = useAppStore((s) => s.selectedTeamId);
  const onlineUserIds = useOnlineUserIds(selectedTeamId);
  const onlineUsers = useOnlineUsers(selectedTeamId, onlineUserIds);

  const activeMember = useMemo(() => {
    if (!selectedTeamId) return null;
    return loginState.memberInfos.find((m) => m.teamId === selectedTeamId) ?? null;
  }, [loginState.memberInfos, selectedTeamId]);

  const isAdmin = useMemo(() => {
    return activeMember ? hasRole(activeMember, "admin") : false;
  }, [activeMember]);

  const loadComments = useCallback(
    async (teamId: string) => {
      setCommentsLoading(true);
      const result = await listComments(client, {
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
    [client, showToast],
  );

  useEffect(() => {
    if (!selectedTeamId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadComments(selectedTeamId);
  }, [selectedTeamId, loadComments]);

  const handleSendComment = useCallback(
    async (content: string) => {
      if (!selectedTeamId || !currentUserId) return;
      const result = await createComment(client, {
        teamId: selectedTeamId,
        content,
      });
      if (!result.success) {
        console.error("[Workspace] 发送留言失败:", result.error);
        showLocalApiFailure(result, showToast, "发送留言失败");
        return;
      }
      const newComment: CommentInfo = {
        id: result.data,
        teamId: selectedTeamId,
        userId: currentUserId,
        user: loginState.userInfo,
        content,
        createdAt: Date.now(),
      };
      setComments((prev) => [...prev, newComment]);
    },
    [client, selectedTeamId, currentUserId, loginState.userInfo, showToast],
  );

  const handleDetailChanged = useCallback(() => {
    setComicListRefreshKey((key) => key + 1);
    retryComicDetail();
  }, [retryComicDetail]);
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
          onNavigateToTranslator={navigateToTranslator}
          onChanged={handleDetailChanged}
          onClose={() => {
            clearComicDetail();
          }}
        />
      )}
    </>
  );
}
