import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { AssignmentInfo } from "@/route/_authenticated/business/assignment/assignment";
import type { MemberInfo } from "@/route/business/identity/member";
import { hasRole, type Role } from "@/route/business/identity/role";
import type { ToastType } from "@/shared/component/notification-toast/notification-toast-type";
import { showLocalApiFailure, showLocalCaughtError } from "@/route/business/request-error";
import { assignmentRolesForStage } from "@/route/_authenticated/_shell/business/comic-detail/assignment-stage";
import type { DetailContract } from "@/route/_authenticated/_shell/business/comic-detail/comic-detail-type";

type Args = {
  selectedChapterId: string | null;
  currentUserId: string;
  activeMember: MemberInfo | null;
  assignments: AssignmentInfo[];
  currentAssignment: AssignmentInfo | undefined;
  memberSelectorRole: Role | null;
  setMemberSelectorRole: Dispatch<SetStateAction<Role | null>>;
  setIsAddingAssignment: Dispatch<SetStateAction<boolean>>;
  joiningRoles: Partial<Record<Role, boolean>>;
  setJoiningRoles: Dispatch<SetStateAction<Partial<Record<Role, boolean>>>>;
  leavingRoles: Partial<Record<Role, boolean>>;
  setLeavingRoles: Dispatch<SetStateAction<Partial<Record<Role, boolean>>>>;
  onAddAssignment?: DetailContract["onAddAssignment"] | undefined;
  onRemoveAssignment?: DetailContract["onRemoveAssignment"] | undefined;
  onJoinChapterRole?: DetailContract["onJoinChapterRole"] | undefined;
  onWorkflowRecordsChanged?: (() => void) | undefined;
  reloadAssignments: () => Promise<AssignmentInfo[] | null>;
  showToast: (message: string, type: ToastType) => void;
};

interface AssignmentActions {
  handleRemoveAssignment: (userId: string, role: Role) => void;
  handleOpenMemberSelector: (role: Role) => void;
  handleAddAssignment: (userId: string) => Promise<void>;
  canJoinRole: (role: Role) => boolean;
  canLeaveRole: (role: Role) => boolean;
  handleJoinRole: (role: Role) => Promise<void>;
  handleLeaveRole: (role: Role) => Promise<void>;
}

export function useComicDetailAssignmentActions({
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
}: Args): AssignmentActions {
  const removeRoles = useCallback(
    async (userId: string, roles: Role[]): Promise<boolean> => {
      if (!selectedChapterId || !onRemoveAssignment || roles.length === 0) {
        return false;
      }
      let isChanged = false;
      try {
        for (const role of roles) {
          const result = await onRemoveAssignment(selectedChapterId, userId, role);
          if (!result.success) {
            console.error("[ComicDetailModal] 移除角色失败:", result);
            showLocalApiFailure(result, showToast);
            if (isChanged) await reloadAssignments();
            return false;
          }
          isChanged = true;
        }
        await reloadAssignments();
        onWorkflowRecordsChanged?.();
        return true;
      } catch (error) {
        console.error("[ComicDetailModal] 移除角色异常:", error);
        showLocalCaughtError(error, showToast, "移除角色失败");
        if (isChanged) await reloadAssignments();
        return false;
      }
    },
    [onRemoveAssignment, onWorkflowRecordsChanged, reloadAssignments, selectedChapterId, showToast],
  );

  const handleRemoveAssignment = useCallback(
    (userId: string, role: Role): void => {
      const assignment = assignments.find((item) => item.userId === userId);
      if (!assignment) return;
      void removeRoles(userId, assignmentRolesForStage(assignment, role));
    },
    [assignments, removeRoles],
  );

  const handleOpenMemberSelector = useCallback(
    (role: Role): void => {
      if (selectedChapterId) setMemberSelectorRole(role);
    },
    [selectedChapterId, setMemberSelectorRole],
  );

  const handleAddAssignment = useCallback(
    async (userId: string): Promise<void> => {
      if (!selectedChapterId || !memberSelectorRole || !onAddAssignment) return;
      setIsAddingAssignment(true);
      const result = await onAddAssignment(selectedChapterId, userId, memberSelectorRole);
      setIsAddingAssignment(false);
      if (!result.success) {
        showLocalApiFailure(result, showToast);
        return;
      }
      await reloadAssignments();
      onWorkflowRecordsChanged?.();
      setMemberSelectorRole(null);
    },
    [
      memberSelectorRole,
      onAddAssignment,
      onWorkflowRecordsChanged,
      reloadAssignments,
      selectedChapterId,
      setIsAddingAssignment,
      setMemberSelectorRole,
      showToast,
    ],
  );

  const isRoleAlreadyJoined = useCallback(
    (role: Role): boolean => {
      if (!currentAssignment) return false;
      if (role === "typesetter") {
        return hasRole(currentAssignment, "typesetter") || hasRole(currentAssignment, "redrawer");
      }
      return hasRole(currentAssignment, role);
    },
    [currentAssignment],
  );

  const canJoinRole = useCallback(
    (role: Role): boolean =>
      Boolean(
        activeMember &&
          onJoinChapterRole &&
          selectedChapterId &&
          currentUserId &&
          hasRole(activeMember, role) &&
          !isRoleAlreadyJoined(role),
      ),
    [activeMember, currentUserId, isRoleAlreadyJoined, onJoinChapterRole, selectedChapterId],
  );

  const canLeaveRole = useCallback(
    (role: Role): boolean =>
      Boolean(
        onRemoveAssignment &&
          selectedChapterId &&
          currentUserId &&
          assignmentRolesForStage(currentAssignment, role).length > 0,
      ),
    [currentAssignment, currentUserId, onRemoveAssignment, selectedChapterId],
  );

  const handleJoinRole = useCallback(
    async (role: Role): Promise<void> => {
      if (!selectedChapterId || !onJoinChapterRole || joiningRoles[role] === true) return;
      setJoiningRoles((previous) => ({ ...previous, [role]: true }));
      try {
        const result = await onJoinChapterRole(selectedChapterId, role);
        if (!result.success) {
          console.error("[ComicDetailModal] 加入章节分工失败:", result);
          showLocalApiFailure(result, showToast);
          return;
        }
        await reloadAssignments();
        onWorkflowRecordsChanged?.();
        showToast("加入分工成功", "success");
      } catch (error) {
        console.error("[ComicDetailModal] 加入章节分工异常:", error);
        showLocalCaughtError(error, showToast, "加入分工失败", true);
      } finally {
        setJoiningRoles((previous) => ({ ...previous, [role]: false }));
      }
    },
    [
      joiningRoles,
      onJoinChapterRole,
      onWorkflowRecordsChanged,
      reloadAssignments,
      selectedChapterId,
      setJoiningRoles,
      showToast,
    ],
  );

  const handleLeaveRole = useCallback(
    async (role: Role): Promise<void> => {
      if (
        !selectedChapterId ||
        !currentUserId ||
        !onRemoveAssignment ||
        leavingRoles[role] === true
      ) {
        return;
      }
      setLeavingRoles((previous) => ({ ...previous, [role]: true }));
      try {
        const removableRoles = assignmentRolesForStage(currentAssignment, role);
        if (removableRoles.length === 0) {
          showToast("当前分工无需退出", "error");
          return;
        }
        const isRemoved = await removeRoles(currentUserId, removableRoles);
        if (isRemoved) showToast("退出分工成功", "success");
      } catch (error) {
        console.error("[ComicDetailModal] 退出章节分工异常:", error);
        showLocalCaughtError(error, showToast, "退出分工失败", true);
      } finally {
        setLeavingRoles((previous) => ({ ...previous, [role]: false }));
      }
    },
    [
      currentAssignment,
      currentUserId,
      leavingRoles,
      onRemoveAssignment,
      removeRoles,
      selectedChapterId,
      setLeavingRoles,
      showToast,
    ],
  );

  return {
    handleRemoveAssignment,
    handleOpenMemberSelector,
    handleAddAssignment,
    canJoinRole,
    canLeaveRole,
    handleJoinRole,
    handleLeaveRole,
  };
}
