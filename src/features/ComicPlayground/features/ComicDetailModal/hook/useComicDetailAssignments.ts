import { useCallback, useEffect, useMemo, useState } from "react";
import type { AssignmentInfo } from "@/types/assignment";
import type { MemberInfo } from "@/types/member";
import { hasRole, matchesAssignmentRole, type Role } from "@/types/role";
import type { ToastType } from "@/components/ui/NotificationToast";
import type { ComicDetailModalProps } from "../types";

type ShowToast = (message: string, type: ToastType) => void;

type Args = {
  selectedChapterId: string | null;
  isSelectedChapterAvailable: boolean;
  currentUserId?: string | null;
  activeMember: MemberInfo | null;
  pinnedChapterId?: string | null;
  onLoadAssignments: ComicDetailModalProps["onLoadAssignments"];
  onLoadAssignableMembers?: ComicDetailModalProps["onLoadAssignableMembers"];
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
  onLoadAssignments,
  onLoadAssignableMembers,
  onAddAssignment,
  onRemoveAssignment,
  onJoinChapterRole,
  showToast,
}: Args) {
  const [assignments, setAssignments] = useState<AssignmentInfo[]>([]);
  const [assignableMembers, setAssignableMembers] = useState<MemberInfo[]>([]);
  const [isMemberSelectorLoading, setIsMemberSelectorLoading] = useState(false);
  const [memberSelectorRole, setMemberSelectorRole] = useState<Role | null>(null);
  const [isAddingAssignment, setIsAddingAssignment] = useState(false);
  const [joiningRoles, setJoiningRoles] = useState<Partial<Record<Role, boolean>>>({});
  const [leavingRoles, setLeavingRoles] = useState<Partial<Record<Role, boolean>>>({});
  const [canCreateChapter, setCanCreateChapter] = useState(false);

  useEffect(() => {
    if (!selectedChapterId || !isSelectedChapterAvailable) return;
    setAssignments([]);
    onLoadAssignments(selectedChapterId)
      .then((res) => {
        if (!res.success) {
          console.error("[ComicDetailModal] 加载分工失败:", res);
          showToast("加载分工失败", "error");
          return;
        }
        setAssignments(res.data);
      })
      .catch((err) => {
        console.error("[ComicDetailModal] 加载分工异常:", err);
        showToast("加载分工失败", "error");
      });
  }, [isSelectedChapterAvailable, onLoadAssignments, selectedChapterId, showToast]);

  const reloadAssignments = useCallback(async () => {
    if (!selectedChapterId) return null;
    const refreshed = await onLoadAssignments(selectedChapterId);
    if (!refreshed.success) {
      console.error("[ComicDetailModal] 刷新分工失败:", refreshed);
      showToast(refreshed.error, "error");
      return null;
    }
    setAssignments(refreshed.data);
    return refreshed.data;
  }, [onLoadAssignments, selectedChapterId, showToast]);

  useEffect(() => {
    if (activeMember && hasRole(activeMember, "admin")) {
      setCanCreateChapter(true);
      return;
    }

    if (!pinnedChapterId || !currentUserId) {
      setCanCreateChapter(false);
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
  }, [activeMember, currentUserId, onLoadAssignments, pinnedChapterId]);

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
    !!currentAssignment && hasRole(currentAssignment, "reviewer");
  const canUploadRawPages = !!currentAssignment && hasRole(currentAssignment, "rawProvider");
  const isTeamAdmin = activeMember !== null && hasRole(activeMember, "admin");

  const assignedUserIdsForSelectedRole =
    memberSelectorRole === null
      ? []
      : assignments
          .filter((assignment) => matchesAssignmentRole(assignment, memberSelectorRole))
          .map((assignment) => assignment.userId);

  const handleRemoveAssignment = useCallback(
    (userId: string, role: Role) => {
      if (!selectedChapterId || !onRemoveAssignment) return;
      onRemoveAssignment(selectedChapterId, userId, role)
        .then((res) => {
          if (!res.success) {
            console.error("[ComicDetailModal] 移除角色失败:", res);
            showToast("移除角色失败", "error");
            return;
          }
          void reloadAssignments();
        })
        .catch((err) => {
          console.error("[ComicDetailModal] 移除角色异常:", err);
          showToast("移除角色失败", "error");
        });
    },
    [onRemoveAssignment, reloadAssignments, selectedChapterId, showToast],
  );

  const handleOpenMemberSelector = useCallback(
    (role: Role) => {
      if (!selectedChapterId || !onLoadAssignableMembers) return;
      setMemberSelectorRole(role);
      setIsMemberSelectorLoading(true);
      onLoadAssignableMembers(selectedChapterId)
        .then((result) => {
          if (!result.success) {
            showToast(result.error, "error");
            return;
          }
          setAssignableMembers(result.data);
        })
        .catch((err) => {
          console.error("[ComicDetailModal] 加载可分配成员异常:", err);
          showToast("加载成员失败", "error");
        })
        .finally(() => setIsMemberSelectorLoading(false));
    },
    [onLoadAssignableMembers, selectedChapterId, showToast],
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

  const resolveSelfRoleForRemoval = useCallback(
    (role: Role): Role | null => {
      if (!currentAssignment) return null;
      if (role !== "typesetter") {
        return hasRole(currentAssignment, role) ? role : null;
      }
      if (hasRole(currentAssignment, "typesetter")) return "typesetter";
      if (hasRole(currentAssignment, "redrawer")) return "redrawer";
      return null;
    },
    [currentAssignment],
  );

  const canLeaveRole = useCallback(
    (role: Role) => {
      if (!onRemoveAssignment || !selectedChapterId || !currentUserId) {
        return false;
      }
      return resolveSelfRoleForRemoval(role) !== null;
    },
    [currentUserId, onRemoveAssignment, resolveSelfRoleForRemoval, selectedChapterId],
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
        const removableRole = resolveSelfRoleForRemoval(role);
        if (!removableRole) {
          showToast("当前分工无需退出", "error");
          return;
        }

        const result = await onRemoveAssignment(selectedChapterId, currentUserId, removableRole);
        if (!result.success) {
          console.error("[ComicDetailModal] 退出章节分工失败:", result);
          showToast(result.error, "error");
          return;
        }

        await reloadAssignments();
        showToast("退出分工成功", "success");
      } catch (err) {
        console.error("[ComicDetailModal] 退出章节分工异常:", err);
        showToast(err instanceof Error ? err.message : "退出分工失败", "error");
      } finally {
        setLeavingRoles((prev) => ({ ...prev, [role]: false }));
      }
    },
    [currentUserId, leavingRoles, onRemoveAssignment, reloadAssignments, resolveSelfRoleForRemoval, selectedChapterId, showToast],
  );

  return {
    assignments,
    setAssignments,
    assignableMembers,
    memberSelectorRole,
    setMemberSelectorRole,
    isMemberSelectorLoading,
    isAddingAssignment,
    joiningRoles,
    leavingRoles,
    assignedUserIdsForSelectedRole,
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
