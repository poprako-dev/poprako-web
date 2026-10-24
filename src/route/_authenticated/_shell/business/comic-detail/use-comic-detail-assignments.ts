import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { AssignmentInfo } from "@/route/_authenticated/business/assignment/assignment";
import type { MemberInfo } from "@/route/business/identity/member";
import { hasRole, type WorkerRole } from "@/route/business/identity/role";
import type { ToastType } from "@/shared/component/notification-toast/notification-toast-type";
import { useComicDetailAssignmentActions } from "@/route/_authenticated/_shell/business/comic-detail/use-comic-detail-assignment-actions";
import type { DetailContract } from "@/route/_authenticated/_shell/business/comic-detail/comic-detail-type";

import { useAssignmentResources } from "./use-assignment-resources";

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
  memberSelectorRole: WorkerRole | null;
  setMemberSelectorRole: Dispatch<SetStateAction<WorkerRole | null>>;
  isMemberSelectorLoading: boolean;
  setIsMemberSelectorLoading: Dispatch<SetStateAction<boolean>>;
  isAddingAssignment: boolean;
  joiningRoles: Partial<Record<WorkerRole, boolean>>;
  leavingRoles: Partial<Record<WorkerRole, boolean>>;
  currentAssignment: AssignmentInfo | undefined;
  canTranslateOrProofread: boolean;
  canReadOnly: boolean;
  canUploadRawPages: boolean;
  isTeamAdmin: boolean;
  canCreateChapter: boolean;
  reloadAssignments: () => Promise<AssignmentInfo[] | null>;
  handleRemoveAssignment: (userId: string, role: WorkerRole) => void;
  handleOpenMemberSelector: (role: WorkerRole) => void;
  handleAddAssignment: (userId: string) => Promise<void>;
  canJoinRole: (role: WorkerRole) => boolean;
  canLeaveRole: (role: WorkerRole) => boolean;
  handleJoinRole: (role: WorkerRole) => Promise<void>;
  handleLeaveRole: (role: WorkerRole) => Promise<void>;
};

type AssignmentPermissions = Pick<
  AssignmentState,
  | "currentAssignment"
  | "canTranslateOrProofread"
  | "canReadOnly"
  | "canUploadRawPages"
  | "isTeamAdmin"
  | "canCreateChapter"
>;

type AssignmentInteractionState = {
  isMemberSelectorLoading: boolean;
  setIsMemberSelectorLoading: Dispatch<SetStateAction<boolean>>;
  memberSelectorRole: WorkerRole | null;
  setMemberSelectorRole: Dispatch<SetStateAction<WorkerRole | null>>;
  isAddingAssignment: boolean;
  setIsAddingAssignment: Dispatch<SetStateAction<boolean>>;
  joiningRoles: Partial<Record<WorkerRole, boolean>>;
  setJoiningRoles: Dispatch<SetStateAction<Partial<Record<WorkerRole, boolean>>>>;
  leavingRoles: Partial<Record<WorkerRole, boolean>>;
  setLeavingRoles: Dispatch<SetStateAction<Partial<Record<WorkerRole, boolean>>>>;
};

function useAssignmentInteractionState(): AssignmentInteractionState {
  const [isMemberSelectorLoading, setIsMemberSelectorLoading] = useState(false);
  const [memberSelectorRole, setMemberSelectorRole] = useState<WorkerRole | null>(null);
  const [isAddingAssignment, setIsAddingAssignment] = useState(false);
  const [joiningRoles, setJoiningRoles] = useState<Partial<Record<WorkerRole, boolean>>>({});
  const [leavingRoles, setLeavingRoles] = useState<Partial<Record<WorkerRole, boolean>>>({});
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
    canUploadRawPages: Boolean(currentAssignment && hasRole(currentAssignment, "rawProvider")),
    isTeamAdmin: activeMember !== null && hasRole(activeMember, "admin"),
    canCreateChapter:
      (activeMember !== null && hasRole(activeMember, "admin")) ||
      pinnedAssignments.some(
        (assignment) => assignment.userId === currentUserId && hasRole(assignment, "reviewer"),
      ),
  };
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
  const { currentUserId, activeMember } = args;
  const {
    assignments,
    setAssignments,
    isAssignmentsLoading,
    reloadAssignments,
    pinnedAssignments,
  } = useAssignmentResources({
    ...args,
    scope: JSON.stringify([currentUserId, activeMember?.teamId]),
  });
  const interaction = useAssignmentInteractionState();
  const permissions = resolveAssignmentPermissions(
    assignments,
    currentUserId,
    activeMember,
    pinnedAssignments,
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
