import { useCallback, useMemo, useRef, useState } from "react";
import type { ComicDetailMode } from "@/route/_authenticated/business/navigation/workbench-navigation";
import { useReadySession } from "@/route/business/session/ready-session";
import { hasRole } from "@/route/business/identity/role";
import { useAppStore } from "@/route/business/session/session-store";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import {
  type ComicDetailSearch,
  type WorkbenchDestination,
  useComicDetailHost,
} from "@/route/_authenticated/_shell/business/comic-detail/use-comic-detail-host";
import { useOnlineUserIds, useOnlineUsers } from "./online/use-online-users";
import { useWorkspaceComments } from "./comment/use-workspace-comments";

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
  ReturnType<typeof useWorkspaceComments> & {
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
  onlineCountStatus: ReturnType<typeof useOnlineUserIds>["status"];
  onOnlineOpenChange: (isOpen: boolean) => void;
};
type OnlineScope = { generation: number; userId: string; teamId: string | null };

export function useWorkspaceController({
  search,
  onChangeSearch,
  onNavigateToWorkbench,
}: Props): WorkspaceController {
  const loginState = useReadySession();
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
  const comments = useWorkspaceComments(team.team?.id ?? null);
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
  const { generation, userInfo } = useReadySession();
  const [openScope, setOpenScope] = useState<OnlineScope | null>(null);
  const activeMember = useMemo(() => {
    if (!selectedTeamId) return null;
    return memberInfos.find((member) => member.teamId === selectedTeamId) ?? null;
  }, [memberInfos, selectedTeamId]);
  const isAdmin = useMemo(
    () => (activeMember ? hasRole(activeMember, "admin") : false),
    [activeMember],
  );
  const teamId = activeMember?.team.id ?? null;
  const scope = useMemo(
    () => ({ generation, userId: userInfo.id, teamId }),
    [generation, userInfo.id, teamId],
  );
  const onlineUserIds = useOnlineUserIds(teamId);
  const onlineUsers = useOnlineUsers(teamId, onlineUserIds, openScope === scope);
  const onOnlineOpenChange = useCallback(
    (isOpen: boolean) => {
      setOpenScope(isOpen ? scope : null);
    },
    [scope],
  );
  return {
    team: activeMember?.team ? { id: activeMember.team.id, name: activeMember.team.name } : null,
    isAdmin,
    onlineCount: onlineUserIds.userIds.size,
    onlineUsers: onlineUsers.users,
    onlineStatus: onlineUsers.status,
    onlineCountStatus: onlineUserIds.status,
    onOnlineOpenChange,
  };
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
