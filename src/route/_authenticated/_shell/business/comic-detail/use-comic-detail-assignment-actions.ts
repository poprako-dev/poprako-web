import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { AssignmentInfo } from "@/route/_authenticated/business/assignment/assignment";
import type { MemberInfo } from "@/route/business/identity/member";
import { hasRole, type WorkerRole } from "@/route/business/identity/role";
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
  memberSelectorRole: WorkerRole | null;
  setMemberSelectorRole: Dispatch<SetStateAction<WorkerRole | null>>;
  setIsAddingAssignment: Dispatch<SetStateAction<boolean>>;
  joiningRoles: Partial<Record<WorkerRole, boolean>>;
  setJoiningRoles: Dispatch<SetStateAction<Partial<Record<WorkerRole, boolean>>>>;
  leavingRoles: Partial<Record<WorkerRole, boolean>>;
  setLeavingRoles: Dispatch<SetStateAction<Partial<Record<WorkerRole, boolean>>>>;
  onAddAssignment?: DetailContract["onAddAssignment"] | undefined;
  onRemoveAssignment?: DetailContract["onRemoveAssignment"] | undefined;
  onJoinChapterRole?: DetailContract["onJoinChapterRole"] | undefined;
  onWorkflowRecordsChanged?: (() => void) | undefined;
  reloadAssignments: () => Promise<AssignmentInfo[] | null>;
  showToast: (message: string, type: ToastType) => void;
};

interface AssignmentActions {
  handleRemoveAssignment: (userId: string, role: WorkerRole) => void;
  handleOpenMemberSelector: (role: WorkerRole) => void;
  handleAddAssignment: (userId: string) => Promise<void>;
  canJoinRole: (role: WorkerRole) => boolean;
  canLeaveRole: (role: WorkerRole) => boolean;
  handleJoinRole: (role: WorkerRole) => Promise<void>;
  handleLeaveRole: (role: WorkerRole) => Promise<void>;
}

export function useComicDetailAssignmentActions(args: Args): AssignmentActions {
  const removeRoles = useRemoveRoles(args);
  const handleRemoveAssignment = useRemoveAssignment(args, removeRoles);
  const handleOpenMemberSelector = useOpenMemberSelector(args);
  const handleAddAssignment = useAddAssignment(args);
  const isRoleAlreadyJoined = useIsRoleAlreadyJoined(args.currentAssignment);
  const canJoinRole = useCanJoinRole(args, isRoleAlreadyJoined);
  const canLeaveRole = useCanLeaveRole(args);
  const handleJoinRole = useJoinRole(args);
  const handleLeaveRole = useLeaveRole(args, removeRoles);

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

function useRemoveRoles(args: Args): (userId: string, roles: WorkerRole[]) => Promise<boolean> {
  return useCallback(
    async (userId: string, roles: WorkerRole[]): Promise<boolean> => {
      if (!args.selectedChapterId || !args.onRemoveAssignment || roles.length === 0) {
        return false;
      }
      let isChanged = false;
      try {
        for (const role of roles) {
          const result = await args.onRemoveAssignment(args.selectedChapterId, userId, role);
          if (!result.success) {
            console.error("[ComicDetailModal] 移除角色失败:", result);
            showLocalApiFailure(result, args.showToast);
            if (isChanged) await args.reloadAssignments();
            return false;
          }
          isChanged = true;
        }
        await args.reloadAssignments();
        args.onWorkflowRecordsChanged?.();
        return true;
      } catch (error) {
        console.error("[ComicDetailModal] 移除角色异常:", error);
        showLocalCaughtError(error, args.showToast, "移除角色失败");
        if (isChanged) await args.reloadAssignments();
        return false;
      }
    },
    [args],
  );
}

function useRemoveAssignment(
  args: Args,
  removeRoles: (userId: string, roles: WorkerRole[]) => Promise<boolean>,
): AssignmentActions["handleRemoveAssignment"] {
  return useCallback(
    (userId: string, role: WorkerRole): void => {
      const assignment = args.assignments.find((item) => item.userId === userId);
      if (!assignment) return;
      void removeRoles(userId, assignmentRolesForStage(assignment, role));
    },
    [args.assignments, removeRoles],
  );
}

function useOpenMemberSelector(args: Args): AssignmentActions["handleOpenMemberSelector"] {
  const { selectedChapterId, setMemberSelectorRole } = args;
  return useCallback(
    (role: WorkerRole): void => {
      if (selectedChapterId) setMemberSelectorRole(role);
    },
    [selectedChapterId, setMemberSelectorRole],
  );
}

function useAddAssignment(args: Args): AssignmentActions["handleAddAssignment"] {
  return useCallback(
    async (userId: string): Promise<void> => {
      if (!args.selectedChapterId || !args.memberSelectorRole || !args.onAddAssignment) return;
      args.setIsAddingAssignment(true);
      const result = await args.onAddAssignment(
        args.selectedChapterId,
        userId,
        args.memberSelectorRole,
      );
      args.setIsAddingAssignment(false);
      if (!result.success) {
        showLocalApiFailure(result, args.showToast);
        return;
      }
      await args.reloadAssignments();
      args.onWorkflowRecordsChanged?.();
      args.setMemberSelectorRole(null);
    },
    [args],
  );
}

function useIsRoleAlreadyJoined(
  currentAssignment: AssignmentInfo | undefined,
): (role: WorkerRole) => boolean {
  return useCallback(
    (role: WorkerRole): boolean => {
      if (!currentAssignment) return false;
      if (role === "typesetter") {
        return hasRole(currentAssignment, "typesetter") || hasRole(currentAssignment, "redrawer");
      }
      return hasRole(currentAssignment, role);
    },
    [currentAssignment],
  );
}

function useCanJoinRole(
  args: Args,
  isRoleAlreadyJoined: (role: WorkerRole) => boolean,
): AssignmentActions["canJoinRole"] {
  return useCallback(
    (role: WorkerRole): boolean =>
      Boolean(
        args.activeMember &&
          args.onJoinChapterRole &&
          args.selectedChapterId &&
          args.currentUserId &&
          hasRole(args.activeMember, role) &&
          !isRoleAlreadyJoined(role),
      ),
    [args, isRoleAlreadyJoined],
  );
}

function useCanLeaveRole(args: Args): AssignmentActions["canLeaveRole"] {
  return useCallback(
    (role: WorkerRole): boolean =>
      Boolean(
        args.onRemoveAssignment &&
          args.selectedChapterId &&
          args.currentUserId &&
          assignmentRolesForStage(args.currentAssignment, role).length > 0,
      ),
    [args],
  );
}

function useJoinRole(args: Args): AssignmentActions["handleJoinRole"] {
  return useCallback(
    async (role: WorkerRole): Promise<void> => {
      if (!args.selectedChapterId || !args.onJoinChapterRole || args.joiningRoles[role] === true)
        return;
      args.setJoiningRoles((previous) => ({ ...previous, [role]: true }));
      try {
        const result = await args.onJoinChapterRole(args.selectedChapterId, role);
        if (!result.success) {
          console.error("[ComicDetailModal] 加入章节分工失败:", result);
          showLocalApiFailure(result, args.showToast);
          return;
        }
        await args.reloadAssignments();
        args.onWorkflowRecordsChanged?.();
        args.showToast("加入分工成功", "success");
      } catch (error) {
        console.error("[ComicDetailModal] 加入章节分工异常:", error);
        showLocalCaughtError(error, args.showToast, "加入分工失败", true);
      } finally {
        args.setJoiningRoles((previous) => ({ ...previous, [role]: false }));
      }
    },
    [args],
  );
}

function useLeaveRole(
  args: Args,
  removeRoles: (userId: string, roles: WorkerRole[]) => Promise<boolean>,
): AssignmentActions["handleLeaveRole"] {
  return useCallback(
    async (role: WorkerRole): Promise<void> => {
      if (
        !args.selectedChapterId ||
        !args.currentUserId ||
        !args.onRemoveAssignment ||
        args.leavingRoles[role] === true
      ) {
        return;
      }
      args.setLeavingRoles((previous) => ({ ...previous, [role]: true }));
      try {
        const removableRoles = assignmentRolesForStage(args.currentAssignment, role);
        if (removableRoles.length === 0) {
          args.showToast("当前分工无需退出", "error");
          return;
        }
        const isRemoved = await removeRoles(args.currentUserId, removableRoles);
        if (isRemoved) args.showToast("退出分工成功", "success");
      } catch (error) {
        console.error("[ComicDetailModal] 退出章节分工异常:", error);
        showLocalCaughtError(error, args.showToast, "退出分工失败", true);
      } finally {
        args.setLeavingRoles((previous) => ({ ...previous, [role]: false }));
      }
    },
    [args, removeRoles],
  );
}
