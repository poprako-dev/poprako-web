import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createComment } from "@/api/comment";
import type { ComicDetailMode } from "@/route/_authenticated/business/navigation/workbench-navigation";
import type { CommentInfo } from "./comment/comment";
import { listComments } from "./comment/comment-request";
import { useReadySession } from "@/route/business/session/ready-session";
import { hasRole } from "@/route/business/identity/role";
import { useApiClient } from "@/route/business/api-context";
import { useAppStore } from "@/route/business/session/session-store";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import { showLocalApiFailure } from "@/route/business/request-error";
import {
  type ComicDetailSearch,
  type WorkbenchDestination,
  useComicDetailHost,
} from "@/route/_authenticated/_shell/business/comic-detail/use-comic-detail-host";
import { useOnlineUserIds, useOnlineUsers } from "./online/use-online-users";

type Props = {
  search: ComicDetailSearch;
  onChangeSearch: (
    comicId: string | null,
    chapterId: string | null,
    mode?: ComicDetailMode,
  ) => void;
  onNavigateToWorkbench: (destination: WorkbenchDestination) => void;
};

type WorkspaceController = ReturnType<typeof useComicDetailHost> &
  WorkspaceTeam &
  WorkspaceComments & {
    username: string;
    selectedTeamId: string | null;
    mobileTab: number;
    setMobileTab: React.Dispatch<React.SetStateAction<number>>;
    handleTouchStart: (event: React.TouchEvent) => void;
    handleTouchEnd: (event: React.TouchEvent) => void;
    comicListRefreshKey: number;
    handleDetailChanged: () => void;
  };

type WorkspaceTeam = {
  team: { id: string; name: string } | null;
  isAdmin: boolean;
  onlineCount: number;
  onlineUsers: ReturnType<typeof useOnlineUsers>["users"];
  onlineStatus: ReturnType<typeof useOnlineUsers>["status"];
};

type WorkspaceComments = {
  comments: CommentInfo[];
  commentsLoading: boolean;
  handleSendComment: (content: string) => Promise<void>;
};

export function useWorkspaceController({
  search,
  onChangeSearch,
  onNavigateToWorkbench,
}: Props): WorkspaceController {
  const client = useApiClient();
  const loginState = useReadySession();
  const currentUserId = loginState.userInfo.id;
  const showToast = useToastStore((state) => state.showToast);
  const [comicListRefreshKey, setComicListRefreshKey] = useState(0);
  const [mobileTab, setMobileTab] = useState(0);
  const touchStart = useTouchStart(setMobileTab);
  const detail = useComicDetailHost({
    returnTo: "/workspace",
    showToast,
    search,
    onChangeSearch,
    onNavigateToWorkbench,
  });
  const selectedTeamId = useAppStore((state) => state.selectedTeamId);
  const team = useWorkspaceTeam(selectedTeamId, loginState.memberInfos);
  const comments = useWorkspaceComments({
    client,
    selectedTeamId,
    currentUserId,
    userInfo: loginState.userInfo,
    showToast,
  });
  const retryComicDetail = detail.retryComicDetail;
  const handleDetailChanged = useCallback(() => {
    setComicListRefreshKey((key) => key + 1);
    retryComicDetail();
  }, [retryComicDetail]);
  return {
    username: loginState.userInfo.name,
    selectedTeamId,
    ...team,
    ...comments,
    mobileTab,
    setMobileTab,
    ...touchStart,
    comicListRefreshKey,
    ...detail,
    handleDetailChanged,
  };
}

function useWorkspaceTeam(
  selectedTeamId: string | null,
  memberInfos: ReturnType<typeof useReadySession>["memberInfos"],
): WorkspaceTeam {
  const onlineUserIds = useOnlineUserIds(selectedTeamId);
  const onlineUsers = useOnlineUsers(selectedTeamId, onlineUserIds);
  const activeMember = useMemo(() => {
    if (!selectedTeamId) return null;
    return memberInfos.find((member) => member.teamId === selectedTeamId) ?? null;
  }, [memberInfos, selectedTeamId]);
  const isAdmin = useMemo(
    () => (activeMember ? hasRole(activeMember, "admin") : false),
    [activeMember],
  );
  return {
    team: activeMember?.team ? { id: activeMember.team.id, name: activeMember.team.name } : null,
    isAdmin,
    onlineCount: onlineUserIds.userIds.size,
    onlineUsers: onlineUsers.users,
    onlineStatus: onlineUsers.status,
  };
}

function useWorkspaceComments(input: {
  client: ReturnType<typeof useApiClient>;
  selectedTeamId: string | null;
  currentUserId: string;
  userInfo: ReturnType<typeof useReadySession>["userInfo"];
  showToast: ReturnType<typeof useToastStore.getState>["showToast"];
}): WorkspaceComments {
  const [comments, setComments] = useState<CommentInfo[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const loadComments = useCommentLoader(
    input.client,
    input.showToast,
    setComments,
    setCommentsLoading,
  );
  useEffect(() => {
    if (!input.selectedTeamId) return;
    void loadComments(input.selectedTeamId);
  }, [input.selectedTeamId, loadComments]);
  const handleSendComment = useCommentSender({ ...input, setComments });
  return { comments, commentsLoading, handleSendComment };
}

function useTouchStart(
  setMobileTab: React.Dispatch<React.SetStateAction<number>>,
): Pick<WorkspaceController, "handleTouchStart" | "handleTouchEnd"> {
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    touchStartXRef.current = event.touches[0]?.clientX ?? 0;
    touchStartYRef.current = event.touches[0]?.clientY ?? 0;
  }, []);
  const handleTouchEnd = useCallback(
    (event: React.TouchEvent) => {
      const touch = event.changedTouches[0];
      if (!touch) return;
      const dx = touch.clientX - touchStartXRef.current;
      const dy = touch.clientY - touchStartYRef.current;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 60) {
        if (dx < 0) setMobileTab((tab) => Math.min(tab + 1, 1));
        else setMobileTab((tab) => Math.max(tab - 1, 0));
      }
    },
    [setMobileTab],
  );
  return { handleTouchStart, handleTouchEnd };
}

function useCommentLoader(
  client: ReturnType<typeof useApiClient>,
  showToast: ReturnType<typeof useToastStore.getState>["showToast"],
  setComments: React.Dispatch<React.SetStateAction<CommentInfo[]>>,
  setCommentsLoading: React.Dispatch<React.SetStateAction<boolean>>,
): (teamId: string) => Promise<void> {
  return useCallback(
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
    [client, setComments, setCommentsLoading, showToast],
  );
}

function useCommentSender(input: {
  client: ReturnType<typeof useApiClient>;
  selectedTeamId: string | null;
  currentUserId: string;
  userInfo: ReturnType<typeof useReadySession>["userInfo"];
  showToast: ReturnType<typeof useToastStore.getState>["showToast"];
  setComments: React.Dispatch<React.SetStateAction<CommentInfo[]>>;
}): (content: string) => Promise<void> {
  const { client, selectedTeamId, currentUserId, userInfo, showToast, setComments } = input;
  return useCallback(
    async (content: string) => {
      if (!selectedTeamId || !currentUserId) return;
      const result = await createComment(client, { teamId: selectedTeamId, content });
      if (!result.success) {
        console.error("[Workspace] 发送留言失败:", result.error);
        showLocalApiFailure(result, showToast, "发送留言失败");
        return;
      }
      const newComment: CommentInfo = {
        id: result.data,
        teamId: selectedTeamId,
        userId: currentUserId,
        user: userInfo,
        content,
        createdAt: Date.now(),
      };
      setComments((previous) => [...previous, newComment]);
    },
    [client, selectedTeamId, currentUserId, userInfo, showToast, setComments],
  );
}
