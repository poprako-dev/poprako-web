import type { ReactElement } from "react";

import type { Role } from "@/route/business/identity/role";

import { ComicDetailWorkflowView } from "@/route/_authenticated/_shell/business/comic-detail/ComicDetailWorkflowView";

import type { ComicDetailModalState } from "./use-comic-detail-modal-state";

type Props = { state: ComicDetailModalState };

export function ComicDetailModalWorkflow({ state }: Props): ReactElement {
  const {
    chapters,
    resource,
    assignments: assignmentState,
    workflow,
    actions,
    getWorkflowRecordUserLabel,
  } = state;
  const { selectedChapter, selectedChapterId } = chapters;
  const { currentUserId } = resource;
  const {
    assignments,
    isAssignmentsLoading,
    joiningRoles,
    leavingRoles,
    canManageChapterAssignments,
    handleRemoveAssignment,
    handleOpenMemberSelector,
    canJoinRole,
    canLeaveRole,
    handleJoinRole,
    handleLeaveRole,
  } = assignmentState;
  const { state: workflowRecordState, loadMore: loadMoreWorkflowRecords } = workflow;
  const handleTransition = actions.handleTransition;

  const assignmentProps = {
    selectedChapter,
    assignments,
    currentUserId,
    onTransiteWorkflow: handleTransition,
    onRemoveAssignment: handleRemoveAssignment,
    onAddAssignment: handleOpenMemberSelector,
    onJoinRole: handleJoinRole,
    canJoinRole,
    isRoleJoining: (role: Role) => joiningRoles[role] === true,
    onLeaveRole: handleLeaveRole,
    canLeaveRole,
    isRoleLeaving: (role: Role) => leavingRoles[role] === true,
    canOperateWorkflow: canManageChapterAssignments,
    canManageAssignments: canManageChapterAssignments,
  };

  return (
    <ComicDetailWorkflowView
      assignmentProps={assignmentProps}
      isAssignmentsLoading={isAssignmentsLoading}
      chapterId={selectedChapterId}
      workflowRecordState={workflowRecordState}
      getWorkflowRecordUserLabel={getWorkflowRecordUserLabel}
      loadMoreWorkflowRecords={loadMoreWorkflowRecords}
    />
  );
}
