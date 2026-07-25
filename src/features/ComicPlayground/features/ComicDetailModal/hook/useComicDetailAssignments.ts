import { useCallback, useEffect, useMemo, useState } from "react";
import type { AssignmentInfo } from "@/types/assignment";
import type { MemberInfo } from "@/types/member";
import { hasRole, type Role } from "@/types/role";
import type { ToastType } from "@/components/ui/NotificationToast";
import { assignmentRolesForStage } from "../assignmentStage";
import type { ComicDetailModalProps } from "../types";

type ShowToast = (message: string, type: ToastType) => void;

type Args = {
  selectedChapterId: string | null;
  isSelectedChapterAvailable: boolean;
  currentUserId?: string | null;
  activeMember: MemberInfo | null;
  pinnedChapterId?: string | null;
  pinnedChapterAssignments?: AssignmentInfo[];
  onLoadAssignments: ComicDetailModalProps["onLoadAssignments"];
  onAddAssignment?: ComicDetailModalProps["onAddAssignment"];
  onRemoveAssignment?: ComicDetailModalProps["onRemoveAssignment"];
  onJoinChapterRole?: ComicDetailModalProps["onJoinChapterRole"];
  showToast: ShowToast;
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
  showToast,
}: Args) {
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAssignments([]);
      setIsAssignmentsLoading(false);
      return;
    }

    let cancelled = false;
    setAssignments([]);
    setIsAssignmentsLoading(true);
    onLoadAssignments(selectedChapterId)
      .then((res) => {
        if (cancelled) return;
        if (!res.success) {
          console.error("[ComicDetailModal] 加载分工失败:", res);
          showToast("加载分工失败", "error");
          return;
        }
        setAssignments(res.data);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("[ComicDetailModal] 加载分工异常:", err);
        showToast("加载分工失败", "error");
      })
      .finally(() => {
        if (!cancelled) setIsAssignmentsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isSelectedChapterAvailable, onLoadAssignments, selectedChapterId, showToast]);

  const reloadAssignments = useCallback(async () => {
    if (!selectedChapterId) return null;
    setIsAssignmentsLoading(true);
    try {
      const refreshed = await onLoadAssignments(selectedChapterId);
      if (!refreshed.success) {
        console.error("[ComicDetailModal] 刷新分工失败:", refreshed);
        showToast(refreshed.error, "error");
        return null;
      }
      setAssignments(refreshed.data);
      return refreshed.data;
    } catch (err) {
      console.error("[ComicDetailModal] 刷新分工异常:", err);
      showToast("刷新分工失败", "error");
      return null;
    } finally {
      setIsAssignmentsLoading(false);
    }
  }, [onLoadAssignments, selectedChapterId, showToast]);

  useEffect(() => {
    if (activeMember && hasRole(activeMember, "admin")) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCanCreateChapter(true);
      return;
    }

    if (!pinnedChapterId || !currentUserId) {
      setCanCreateChapter(false);
      return;
    }

    // 优先使用预加载的置顶章节分工数据，避免额外网络请求
    if (pinnedChapterAssignments) {
      const pinnedAssignment = pinnedChapterAssignments.find(
        (assignment) => assignment.userId === currentUserId,
      );
      setCanCreateChapter(
        !!pinnedAssignment && hasRole(pinnedAssignment, "reviewer"),
      );
      return;
    }

    let cancelled = false;

    onLoadAssignments(pinnedChapterId)
      .then((res) => {
        if (!res.success) {
          console.error("[ComicDetailModal] 加载 pinned 章节分工失败:", res);
          if (!cancelled) {
            setCanCreateChapter(false);
          }
          return;
        }

        const pinnedAssignment = res.data.find(
          (assignment) => assignment.userId === currentUserId,
        );

        if (!cancelled) {
          setCanCreateChapter(
            !!pinnedAssignment && hasRole(pinnedAssignment, "reviewer"),
          );
        }
      })
      .catch((err) => {
        console.error("[ComicDetailModal] 加载 pinned 章节分工异常:", err);
        if (!cancelled) {
          setCanCreateChapter(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    activeMember,
    currentUserId,
    onLoadAssignments,
    pinnedChapterAssignments,
    pinnedChapterId,
  ]);

  const currentAssignment = useMemo(
    () => assignments.find((item) => item.userId === currentUserId),
    [assignments, currentUserId],
  );

  const canTranslateOrProofread =
    !!currentAssignment &&
    (hasRole(currentAssignment, "translator") ||
      hasRole(currentAssignment, "proofreader"));
  const canReadOnly = activeMember !== null && !canTranslateOrProofread;
  const canManageChapterAssignments =
    !!currentAssignment && hasRole(currentAssignment, "admin");
  const canUploadRawPages = !!currentAssignment && hasRole(currentAssignment, "rawProvider");
  const isTeamAdmin = activeMember !== null && hasRole(activeMember, "admin");

  const removeRoles = useCallback(
    async (userId: string, roles: Role[]) => {
      if (!selectedChapterId || !onRemoveAssignment || roles.length === 0) {
        return false;
      }

      let changed = false;
      try {
        for (const role of roles) {
          const result = await onRemoveAssignment(selectedChapterId, userId, role);
          if (!result.success) {
            console.error("[ComicDetailModal] 移除角色失败:", result);
            showToast(result.error, "error");
            if (changed) await reloadAssignments();
            return false;
          }
          changed = true;
        }

        await reloadAssignments();
        return true;
      } catch (err) {
        console.error("[ComicDetailModal] 移除角色异常:", err);
        showToast("移除角色失败", "error");
        if (changed) await reloadAssignments();
        return false;
      }
    },
    [onRemoveAssignment, reloadAssignments, selectedChapterId, showToast],
  );

  const handleRemoveAssignment = useCallback(
    (userId: string, role: Role) => {
      const assignment = assignments.find((item) => item.userId === userId);
      void removeRoles(userId, assignmentRolesForStage(assignment, role));
    },
    [assignments, removeRoles],
  );

  const handleOpenMemberSelector = useCallback(
    (role: Role) => {
      if (!selectedChapterId) return;
      setMemberSelectorRole(role);
    },
    [selectedChapterId],
  );

  const handleAddAssignment = useCallback(
    async (userId: string) => {
      if (!selectedChapterId || !memberSelectorRole || !onAddAssignment) return;
      setIsAddingAssignment(true);
      const result = await onAddAssignment(selectedChapterId, userId, memberSelectorRole);
      setIsAddingAssignment(false);

      if (!result.success) {
        showToast(result.error, "error");
        return;
      }

      await reloadAssignments();
      setMemberSelectorRole(null);
    },
    [memberSelectorRole, onAddAssignment, reloadAssignments, selectedChapterId, showToast],
  );

  const isRoleAlreadyJoined = useCallback(
    (role: Role) => {
      if (!currentAssignment) return false;
      if (role === "typesetter") {
        return (
          hasRole(currentAssignment, "typesetter") ||
          hasRole(currentAssignment, "redrawer")
        );
      }
      return hasRole(currentAssignment, role);
    },
    [currentAssignment],
  );

  const canJoinRole = useCallback(
    (role: Role) => {
      if (!activeMember || !onJoinChapterRole || !selectedChapterId || !currentUserId) {
        return false;
      }
      return hasRole(activeMember, role) && !isRoleAlreadyJoined(role);
    },
    [activeMember, currentUserId, isRoleAlreadyJoined, onJoinChapterRole, selectedChapterId],
  );

  const canLeaveRole = useCallback(
    (role: Role) => {
      if (!onRemoveAssignment || !selectedChapterId || !currentUserId) {
        return false;
      }
      return assignmentRolesForStage(currentAssignment, role).length > 0;
    },
    [currentAssignment, currentUserId, onRemoveAssignment, selectedChapterId],
  );

  const handleJoinRole = useCallback(
    async (role: Role) => {
      if (!selectedChapterId || !onJoinChapterRole || joiningRoles[role]) return;

      setJoiningRoles((prev) => ({ ...prev, [role]: true }));
      try {
        const result = await onJoinChapterRole(selectedChapterId, role);
        if (!result.success) {
          console.error("[ComicDetailModal] 加入章节分工失败:", result);
          showToast(result.error, "error");
          return;
        }

        await reloadAssignments();
        showToast("加入分工成功", "success");
      } catch (err) {
        console.error("[ComicDetailModal] 加入章节分工异常:", err);
        showToast(err instanceof Error ? err.message : "加入分工失败", "error");
      } finally {
        setJoiningRoles((prev) => ({ ...prev, [role]: false }));
      }
    },
    [joiningRoles, onJoinChapterRole, reloadAssignments, selectedChapterId, showToast],
  );

  const handleLeaveRole = useCallback(
    async (role: Role) => {
      if (!selectedChapterId || !currentUserId || !onRemoveAssignment || leavingRoles[role]) {
        return;
      }

      setLeavingRoles((prev) => ({ ...prev, [role]: true }));
      try {
        const removableRoles = assignmentRolesForStage(currentAssignment, role);
        if (removableRoles.length === 0) {
          showToast("当前分工无需退出", "error");
          return;
        }

        const removed = await removeRoles(currentUserId, removableRoles);
        if (removed) showToast("退出分工成功", "success");
      } catch (err) {
        console.error("[ComicDetailModal] 退出章节分工异常:", err);
        showToast(err instanceof Error ? err.message : "退出分工失败", "error");
      } finally {
        setLeavingRoles((prev) => ({ ...prev, [role]: false }));
      }
    },
    [
      currentAssignment,
      currentUserId,
      leavingRoles,
      onRemoveAssignment,
      removeRoles,
      selectedChapterId,
      showToast,
    ],
  );

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
    handleRemoveAssignment,
    handleOpenMemberSelector,
    handleAddAssignment,
    canJoinRole,
    canLeaveRole,
    handleJoinRole,
    handleLeaveRole,
  };
}
