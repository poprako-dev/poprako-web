import { useCallback, useEffect, useState } from "react";
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

type SelectedAssignments = Pick<
  Args,
  "selectedChapterId" | "isSelectedChapterAvailable" | "onLoadAssignments" | "showToast"
>;

type AssignmentPermissions = Pick<
  AssignmentState,
  | "currentAssignment"
  | "canTranslateOrProofread"
  | "canReadOnly"
  | "canManageChapterAssignments"
  | "canUploadRawPages"
  | "isTeamAdmin"
  | "canCreateChapter"
>;

type AssignmentInteractionState = {
  isMemberSelectorLoading: boolean;
  setIsMemberSelectorLoading: Dispatch<SetStateAction<boolean>>;
  memberSelectorRole: Role | null;
  setMemberSelectorRole: Dispatch<SetStateAction<Role | null>>;
  isAddingAssignment: boolean;
  setIsAddingAssignment: Dispatch<SetStateAction<boolean>>;
  joiningRoles: Partial<Record<Role, boolean>>;
  setJoiningRoles: Dispatch<SetStateAction<Partial<Record<Role, boolean>>>>;
  leavingRoles: Partial<Record<Role, boolean>>;
  setLeavingRoles: Dispatch<SetStateAction<Partial<Record<Role, boolean>>>>;
};

function useAssignmentInteractionState(): AssignmentInteractionState {
  const [isMemberSelectorLoading, setIsMemberSelectorLoading] = useState(false);
  const [memberSelectorRole, setMemberSelectorRole] = useState<Role | null>(null);
  const [isAddingAssignment, setIsAddingAssignment] = useState(false);
  const [joiningRoles, setJoiningRoles] = useState<Partial<Record<Role, boolean>>>({});
  const [leavingRoles, setLeavingRoles] = useState<Partial<Record<Role, boolean>>>({});
  return {
    isMemberSelectorLoading,
    setIsMemberSelectorLoading,
    memberSelectorRole,
    setMemberSelectorRole,
    isAddingAssignment,
    setIsAddingAssignment,
    joiningRoles,
    setJoiningRoles,
    leavingRoles,
    setLeavingRoles,
  };
}

function resolveAssignmentPermissions(
  assignments: AssignmentInfo[],
  currentUserId: string,
  activeMember: MemberInfo | null,
  pinnedAssignments: AssignmentInfo[],
): AssignmentPermissions {
  const currentAssignment = assignments.find((item) => item.userId === currentUserId);
  const canTranslateOrProofread = Boolean(
    currentAssignment &&
      (hasRole(currentAssignment, "translator") || hasRole(currentAssignment, "proofreader")),
  );
  return {
    currentAssignment,
    canTranslateOrProofread,
    canReadOnly: activeMember !== null && !canTranslateOrProofread,
    canManageChapterAssignments: Boolean(currentAssignment && hasRole(currentAssignment, "admin")),
    canUploadRawPages: Boolean(currentAssignment && hasRole(currentAssignment, "rawProvider")),
    isTeamAdmin: activeMember !== null && hasRole(activeMember, "admin"),
    canCreateChapter:
      (activeMember !== null && hasRole(activeMember, "admin")) ||
      pinnedAssignments.some(
        (assignment) => assignment.userId === currentUserId && hasRole(assignment, "reviewer"),
      ),
  };
}

async function fetchSelectedAssignments(
  chapterId: string,
  onLoadAssignments: Args["onLoadAssignments"],
  showToast: ShowToast,
): Promise<AssignmentInfo[] | null> {
  try {
    const result = await onLoadAssignments(chapterId);
    if (!result.success) {
      console.error("[ComicDetailModal] 刷新分工失败:", result);
      showLocalApiFailure(result, showToast);
      return null;
    }
    return result.data;
  } catch (error) {
    console.error("[ComicDetailModal] 刷新分工异常:", error);
    showLocalCaughtError(error, showToast, "刷新分工失败");
    return null;
  }
}

function useSelectedAssignments({
  selectedChapterId,
  isSelectedChapterAvailable,
  onLoadAssignments,
  showToast,
}: SelectedAssignments): Pick<
  AssignmentState,
  "assignments" | "setAssignments" | "isAssignmentsLoading" | "reloadAssignments"
> {
  const [assignments, setAssignments] = useState<AssignmentInfo[]>([]);
  const [isAssignmentsLoading, setIsAssignmentsLoading] = useState(false);
  const reloadAssignments = useCallback(
    () =>
      reloadSelectedAssignments(
        selectedChapterId,
        onLoadAssignments,
        showToast,
        setAssignments,
        setIsAssignmentsLoading,
      ),
    [onLoadAssignments, selectedChapterId, showToast],
  );
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
    void loadInitialAssignments(
      selectedChapterId,
      onLoadAssignments,
      showToast,
      setAssignments,
      setIsAssignmentsLoading,
      () => isCancelled,
    );
    return () => {
      isCancelled = true;
    };
  }, [isSelectedChapterAvailable, onLoadAssignments, selectedChapterId, showToast]);
  return { assignments, setAssignments, isAssignmentsLoading, reloadAssignments };
}

async function reloadSelectedAssignments(
  chapterId: string | null,
  onLoadAssignments: Args["onLoadAssignments"],
  showToast: ShowToast,
  setAssignments: Dispatch<SetStateAction<AssignmentInfo[]>>,
  setLoading: Dispatch<SetStateAction<boolean>>,
): Promise<AssignmentInfo[] | null> {
  if (!chapterId) return null;
  setLoading(true);
  try {
    const refreshed = await fetchSelectedAssignments(chapterId, onLoadAssignments, showToast);
    if (refreshed) setAssignments(refreshed);
    return refreshed;
  } finally {
    setLoading(false);
  }
}

async function loadInitialAssignments(
  chapterId: string,
  onLoadAssignments: Args["onLoadAssignments"],
  showToast: ShowToast,
  setAssignments: Dispatch<SetStateAction<AssignmentInfo[]>>,
  setLoading: Dispatch<SetStateAction<boolean>>,
  isCancelled: () => boolean,
): Promise<void> {
  try {
    const result = await onLoadAssignments(chapterId);
    if (isCancelled()) return;
    if (!result.success) {
      console.error("[ComicDetailModal] 加载分工失败:", result);
      showLocalApiFailure(result, showToast, "加载分工失败");
      return;
    }
    setAssignments(result.data);
  } catch (error) {
    if (isCancelled()) return;
    console.error("[ComicDetailModal] 加载分工异常:", error);
    showLocalCaughtError(error, showToast, "加载分工失败");
  } finally {
    if (!isCancelled()) setLoading(false);
  }
}

function usePinnedAssignments(
  chapterId: string | null | undefined,
  provided: AssignmentInfo[] | undefined,
  onLoadAssignments: Args["onLoadAssignments"],
  showToast: ShowToast,
): AssignmentInfo[] | null {
  const [pinned, setPinned] = useState<{ chapterId: string; assignments: AssignmentInfo[] } | null>(
    null,
  );
  useEffect(() => {
    if (!chapterId || provided !== undefined) return;
    let isCurrent = true;
    void loadPinnedAssignments(
      chapterId,
      onLoadAssignments,
      showToast,
      (assignments) => {
        if (isCurrent) setPinned({ chapterId, assignments });
      },
      () => isCurrent,
    );
    return () => {
      isCurrent = false;
    };
  }, [chapterId, provided, onLoadAssignments, showToast]);
  if (provided !== undefined) return provided;
  if (!pinned || pinned.chapterId !== chapterId) return null;
  return pinned.assignments;
}

async function loadPinnedAssignments(
  chapterId: string,
  onLoadAssignments: Args["onLoadAssignments"],
  showToast: ShowToast,
  setAssignments: (assignments: AssignmentInfo[]) => void,
  isCurrent: () => boolean,
): Promise<void> {
  try {
    const result = await onLoadAssignments(chapterId);
    if (!isCurrent()) return;
    if (!result.success) {
      console.error("[ComicDetail] 加载置顶章节分工失败", result);
      showLocalApiFailure(result, showToast);
      return;
    }
    setAssignments(result.data);
  } catch (error) {
    if (!isCurrent()) return;
    console.error("[ComicDetail] 加载置顶章节分工异常", error);
    showLocalCaughtError(error, showToast, "加载置顶章节分工失败");
  }
}

function useAssignmentActions(
  args: Args,
  assignments: AssignmentInfo[],
  currentAssignment: AssignmentInfo | undefined,
  interaction: AssignmentInteractionState,
  reloadAssignments: () => Promise<AssignmentInfo[] | null>,
): ReturnType<typeof useComicDetailAssignmentActions> {
  return useComicDetailAssignmentActions({
    selectedChapterId: args.selectedChapterId,
    currentUserId: args.currentUserId,
    activeMember: args.activeMember,
    assignments,
    currentAssignment,
    memberSelectorRole: interaction.memberSelectorRole,
    setMemberSelectorRole: interaction.setMemberSelectorRole,
    setIsAddingAssignment: interaction.setIsAddingAssignment,
    joiningRoles: interaction.joiningRoles,
    setJoiningRoles: interaction.setJoiningRoles,
    leavingRoles: interaction.leavingRoles,
    setLeavingRoles: interaction.setLeavingRoles,
    onAddAssignment: args.onAddAssignment,
    onRemoveAssignment: args.onRemoveAssignment,
    onJoinChapterRole: args.onJoinChapterRole,
    onWorkflowRecordsChanged: args.onWorkflowRecordsChanged,
    reloadAssignments,
    showToast: args.showToast,
  });
}

function buildAssignmentState(
  page: Pick<AssignmentState, "assignments" | "setAssignments" | "isAssignmentsLoading">,
  interaction: AssignmentInteractionState,
  permissions: AssignmentPermissions,
  reloadAssignments: AssignmentState["reloadAssignments"],
  actions: ReturnType<typeof useComicDetailAssignmentActions>,
): AssignmentState {
  return {
    ...page,
    memberSelectorRole: interaction.memberSelectorRole,
    setMemberSelectorRole: interaction.setMemberSelectorRole,
    isMemberSelectorLoading: interaction.isMemberSelectorLoading,
    setIsMemberSelectorLoading: interaction.setIsMemberSelectorLoading,
    isAddingAssignment: interaction.isAddingAssignment,
    joiningRoles: interaction.joiningRoles,
    leavingRoles: interaction.leavingRoles,
    ...permissions,
    reloadAssignments,
    ...actions,
  };
}

export function useComicDetailAssignments(args: Args): AssignmentState {
  const {
    selectedChapterId,
    isSelectedChapterAvailable,
    currentUserId,
    activeMember,
    pinnedChapterId,
    pinnedChapterAssignments,
    onLoadAssignments,
    showToast,
  } = args;
  const { assignments, setAssignments, isAssignmentsLoading, reloadAssignments } =
    useSelectedAssignments({
      selectedChapterId,
      isSelectedChapterAvailable,
      onLoadAssignments,
      showToast,
    });
  const interaction = useAssignmentInteractionState();
  const pinnedAssignments = usePinnedAssignments(
    pinnedChapterId,
    pinnedChapterAssignments,
    onLoadAssignments,
    showToast,
  );
  const permissions = resolveAssignmentPermissions(
    assignments,
    currentUserId,
    activeMember,
    pinnedAssignments ?? [],
  );

  const assignmentActions = useAssignmentActions(
    args,
    assignments,
    permissions.currentAssignment,
    interaction,
    reloadAssignments,
  );

  return buildAssignmentState(
    { assignments, setAssignments, isAssignmentsLoading },
    interaction,
    permissions,
    reloadAssignments,
    assignmentActions,
  );
}
