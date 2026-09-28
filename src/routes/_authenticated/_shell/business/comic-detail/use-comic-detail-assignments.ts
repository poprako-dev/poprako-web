import { useCallback, useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { showLocalApiFailure, showLocalCaughtError } from "@/routes/business/request";
import type { AssignmentInfo } from "@/routes/_authenticated/business/assignment/assignment";
import type { MemberInfo } from "@/routes/business/identity/member";
import { hasRole, type Role } from "@/routes/business/identity/role";
import type { ToastType } from "@/shared/component/notification-toast/notification-toast-type";
import { useComicDetailAssignmentActions } from "@/routes/_authenticated/_shell/business/comic-detail/use-comic-detail-assignment-actions";
import type { ComicDetailModalProps } from "@/routes/_authenticated/_shell/business/comic-detail/comic-detail-type";

type ShowToast = (message: string, type: ToastType) => void;

type Args = {
  selectedChapterId: string | null;
  isSelectedChapterAvailable: boolean;
  currentUserId: string | null;
  activeMember: MemberInfo | null;
  pinnedChapterId?: string | null | undefined;
  pinnedChapterAssignments?: AssignmentInfo[] | undefined;
  onLoadAssignments: ComicDetailModalProps["onLoadAssignments"];
  onAddAssignment?: ComicDetailModalProps["onAddAssignment"] | undefined;
  onRemoveAssignment?: ComicDetailModalProps["onRemoveAssignment"] | undefined;
  onJoinChapterRole?: ComicDetailModalProps["onJoinChapterRole"] | undefined;
  onWorkflowRecordsChanged?: (() => void) | undefined;
  showToast: ShowToast;
};

type AssignmentState = {
  assignments: AssignmentInfo[];
  setAssignments: Dispatch<SetStateAction<AssignmentInfo[]>>;
  isAssignmentsLoading: boolean;
  memberSelectorRole: Role | null;
  setMemberSelectorRole: Dispatch<SetStateAction<Role | null>>;
  isMemberSelectorLoading: boolean;
  setIsMemberSelectorLoading: Dispatch<SetStateAction<boolean>>;
  isAddingAssignment: boolean;
  joiningRoles: Partial<Record<Role, boolean>>;
  leavingRoles: Partial<Record<Role, boolean>>;
  currentAssignment: AssignmentInfo | undefined;
  canTranslateOrProofread: boolean;
  canReadOnly: boolean;
  canManageChapterAssignments: boolean;
  canUploadRawPages: boolean;
  isTeamAdmin: boolean;
  canCreateChapter: boolean;
  reloadAssignments: () => Promise<AssignmentInfo[] | null>;
  handleRemoveAssignment: (userId: string, role: Role) => void;
  handleOpenMemberSelector: (role: Role) => void;
  handleAddAssignment: (userId: string) => Promise<void>;
  canJoinRole: (role: Role) => boolean;
  canLeaveRole: (role: Role) => boolean;
  handleJoinRole: (role: Role) => Promise<void>;
  handleLeaveRole: (role: Role) => Promise<void>;
};

export function useComicDetailAssignments({
  selectedChapterId,
  isSelectedChapterAvailable,
  currentUserId,
  activeMember,
  pinnedChapterId,
  pinnedChapterAssignments,
  onLoadAssignments,
  onAddAssignment,
  onRemoveAssignment,
  onJoinChapterRole,
  onWorkflowRecordsChanged,
  showToast,
}: Args): AssignmentState {
  const [assignments, setAssignments] = useState<AssignmentInfo[]>([]);
  const [isAssignmentsLoading, setIsAssignmentsLoading] = useState(false);
  const [isMemberSelectorLoading, setIsMemberSelectorLoading] = useState(false);
  const [memberSelectorRole, setMemberSelectorRole] = useState<Role | null>(null);
  const [isAddingAssignment, setIsAddingAssignment] = useState(false);
  const [joiningRoles, setJoiningRoles] = useState<Partial<Record<Role, boolean>>>({});
  const [leavingRoles, setLeavingRoles] = useState<Partial<Record<Role, boolean>>>({});
  const [canCreateChapter, setCanCreateChapter] = useState(false);

  useEffect(() => {
    if (!selectedChapterId || !isSelectedChapterAvailable) {
      // eslint-disable-next-line @eslint-react/set-state-in-effect, react-hooks/set-state-in-effect
      setAssignments([]);
      setIsAssignmentsLoading(false); // eslint-disable-line @eslint-react/set-state-in-effect
      return;
    }

    let isCancelled = false;
    setAssignments([]); // eslint-disable-line @eslint-react/set-state-in-effect
    setIsAssignmentsLoading(true); // eslint-disable-line @eslint-react/set-state-in-effect
    const loadAssignments = async (): Promise<void> => {
      try {
        const res = await onLoadAssignments(selectedChapterId);
        if (isCancelled) return;
        if (!res.success) {
          console.error("[ComicDetailModal] 加载分工失败:", res);
          showLocalApiFailure(res, showToast, "加载分工失败");
          return;
        }
        setAssignments(res.data);
      } catch (error) {
        if (isCancelled) return;
        console.error("[ComicDetailModal] 加载分工异常:", error);
        showLocalCaughtError(error, showToast, "加载分工失败");
      } finally {
        if (!isCancelled) setIsAssignmentsLoading(false);
      }
    };
    void loadAssignments();

    return () => {
      isCancelled = true;
    };
  }, [isSelectedChapterAvailable, onLoadAssignments, selectedChapterId, showToast]);

  const reloadAssignments = useCallback(async () => {
    if (!selectedChapterId) return null;
    setIsAssignmentsLoading(true);
    try {
      const refreshed = await onLoadAssignments(selectedChapterId);
      if (!refreshed.success) {
        console.error("[ComicDetailModal] 刷新分工失败:", refreshed);
        showLocalApiFailure(refreshed, showToast);
        return null;
      }
      setAssignments(refreshed.data);
      return refreshed.data;
    } catch (error) {
      console.error("[ComicDetailModal] 刷新分工异常:", error);
      showLocalCaughtError(error, showToast, "刷新分工失败");
      return null;
    } finally {
      setIsAssignmentsLoading(false);
    }
  }, [onLoadAssignments, selectedChapterId, showToast]);

  useEffect(() => {
    if (activeMember && hasRole(activeMember, "admin")) {
      // eslint-disable-next-line @eslint-react/set-state-in-effect, react-hooks/set-state-in-effect
      setCanCreateChapter(true);
      return;
    }

    if (!pinnedChapterId || !currentUserId) {
      setCanCreateChapter(false); // eslint-disable-line @eslint-react/set-state-in-effect
      return;
    }

    // 优先使用预加载的置顶章节分工数据，避免额外网络请求
    if (pinnedChapterAssignments) {
      const pinnedAssignment = pinnedChapterAssignments.find(
        (assignment) => assignment.userId === currentUserId,
      );
      // eslint-disable-next-line @eslint-react/set-state-in-effect
      setCanCreateChapter(pinnedAssignment !== undefined && hasRole(pinnedAssignment, "reviewer"));
      return;
    }

    let isCancelled = false;

    const loadPinnedAssignments = async (): Promise<void> => {
      try {
        const res = await onLoadAssignments(pinnedChapterId);
        if (!res.success) {
          console.error("[ComicDetailModal] 加载 pinned 章节分工失败:", res);
          if (!isCancelled) {
            setCanCreateChapter(false);
          }
          return;
        }

        const pinnedAssignment = res.data.find((assignment) => assignment.userId === currentUserId);

        if (!isCancelled) {
          setCanCreateChapter(
            pinnedAssignment !== undefined && hasRole(pinnedAssignment, "reviewer"),
          );
        }
      } catch (error) {
        console.error("[ComicDetailModal] 加载 pinned 章节分工异常:", error);
        if (!isCancelled) {
          setCanCreateChapter(false);
        }
      }
    };
    void loadPinnedAssignments();

    return () => {
      isCancelled = true;
    };
  }, [activeMember, currentUserId, onLoadAssignments, pinnedChapterAssignments, pinnedChapterId]);

  const currentAssignment = useMemo(
    () => assignments.find((item) => item.userId === currentUserId),
    [assignments, currentUserId],
  );

  const canTranslateOrProofread =
    currentAssignment !== undefined &&
    (hasRole(currentAssignment, "translator") || hasRole(currentAssignment, "proofreader"));
  const canReadOnly = activeMember !== null && !canTranslateOrProofread;
  const canManageChapterAssignments =
    currentAssignment !== undefined && hasRole(currentAssignment, "admin");
  const canUploadRawPages =
    currentAssignment !== undefined && hasRole(currentAssignment, "rawProvider");
  const isTeamAdmin = activeMember !== null && hasRole(activeMember, "admin");

  const assignmentActions = useComicDetailAssignmentActions({
    selectedChapterId,
    currentUserId,
    activeMember,
    assignments,
    currentAssignment,
    memberSelectorRole,
    setMemberSelectorRole,
    setIsAddingAssignment,
    joiningRoles,
    setJoiningRoles,
    leavingRoles,
    setLeavingRoles,
    onAddAssignment,
    onRemoveAssignment,
    onJoinChapterRole,
    onWorkflowRecordsChanged,
    reloadAssignments,
    showToast,
  });

  return {
    assignments,
    setAssignments,
    isAssignmentsLoading,
    memberSelectorRole,
    setMemberSelectorRole,
    isMemberSelectorLoading,
    setIsMemberSelectorLoading,
    isAddingAssignment,
    joiningRoles,
    leavingRoles,
    currentAssignment,
    canTranslateOrProofread,
    canReadOnly,
    canManageChapterAssignments,
    canUploadRawPages,
    isTeamAdmin,
    canCreateChapter,
    reloadAssignments,
    ...assignmentActions,
  };
}
