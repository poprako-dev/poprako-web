import { useCallback, useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { showLocalApiFailure, showLocalCaughtError } from "@/route/business/request-error";
import type { AssignmentInfo } from "@/route/_authenticated/business/assignment/assignment";
import type { MemberInfo } from "@/route/business/identity/member";
import { hasRole, type Role } from "@/route/business/identity/role";
import type { ToastType } from "@/shared/component/notification-toast/notification-toast-type";
import { useComicDetailAssignmentActions } from "@/route/_authenticated/_shell/business/comic-detail/use-comic-detail-assignment-actions";
import type { DetailContract } from "@/route/_authenticated/_shell/business/comic-detail/comic-detail-type";

type ShowToast = (message: string, type: ToastType) => void;

type Args = {
  selectedChapterId: string | null;
  isSelectedChapterAvailable: boolean;
  currentUserId: string;
  activeMember: MemberInfo | null;
  pinnedChapterId?: string | null | undefined;
  pinnedChapterAssignments?: AssignmentInfo[] | undefined;
  onLoadAssignments: DetailContract["onLoadAssignments"];
  onAddAssignment?: DetailContract["onAddAssignment"] | undefined;
  onRemoveAssignment?: DetailContract["onRemoveAssignment"] | undefined;
  onJoinChapterRole?: DetailContract["onJoinChapterRole"] | undefined;
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
  const [pinnedAssignments, setPinnedAssignments] = useState<{
    chapterId: string;
    assignments: AssignmentInfo[];
  } | null>(null);

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
    if (!pinnedChapterId || pinnedChapterAssignments !== undefined) return;
    let current = true;
    void onLoadAssignments(pinnedChapterId)
      .then((result) => {
        if (!current) return;
        if (!result.success) {
          console.error("[ComicDetail] 加载置顶章节分工失败", result);
          showLocalApiFailure(result, showToast);
          return;
        }
        setPinnedAssignments({ chapterId: pinnedChapterId, assignments: result.data });
      })
      .catch((error: unknown) => {
        if (!current) return;
        console.error("[ComicDetail] 加载置顶章节分工异常", error);
        showLocalCaughtError(error, showToast, "加载置顶章节分工失败");
      });
    return () => {
      current = false;
    };
  }, [pinnedChapterId, pinnedChapterAssignments, onLoadAssignments, showToast]);
  const pinned =
    pinnedChapterAssignments ??
    (pinnedAssignments !== null && pinnedAssignments.chapterId === pinnedChapterId
      ? pinnedAssignments.assignments
      : []);
  const canCreateChapter =
    (activeMember !== null && hasRole(activeMember, "admin")) ||
    pinned.some(
      (assignment) => assignment.userId === currentUserId && hasRole(assignment, "reviewer"),
    );

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
