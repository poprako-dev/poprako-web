import type { ReactElement } from "react";
import type { AssignmentInfo } from "@/route/_authenticated/business/assignment/assignment";
import type { ChapterInfo } from "@/route/_authenticated/business/chapter/chapter";
import type { Role } from "@/route/business/identity/role";
import type { WorkflowRecordState } from "@/route/_authenticated/_shell/business/comic-detail/use-comic-detail-workflow-records";
import { AssignmentGroup } from "@/route/_authenticated/_shell/business/comic-detail/AssignmentGroup";
import { WorkflowPanel } from "@/route/_authenticated/_shell/business/comic-detail/WorkflowPanel";
import { WorkflowRecordList } from "@/route/_authenticated/_shell/business/comic-detail/WorkflowRecordList";

type AssignmentViewProps = {
  selectedChapter: ChapterInfo | undefined;
  assignments: AssignmentInfo[];
  currentUserId: string;
  onTransiteWorkflow: Parameters<typeof AssignmentGroup>[0]["onTransiteWorkflow"];
  onRemoveAssignment: Parameters<typeof AssignmentGroup>[0]["onRemoveAssignment"];
  onAddAssignment: Parameters<typeof AssignmentGroup>[0]["onAddAssignment"];
  onJoinRole: Parameters<typeof AssignmentGroup>[0]["onJoinRole"];
  canJoinRole: Parameters<typeof AssignmentGroup>[0]["canJoinRole"];
  isRoleJoining: (role: Role) => boolean;
  onLeaveRole: Parameters<typeof AssignmentGroup>[0]["onLeaveRole"];
  canLeaveRole: Parameters<typeof AssignmentGroup>[0]["canLeaveRole"];
  isRoleLeaving: (role: Role) => boolean;
  canOperateWorkflow: boolean;
  canManageAssignments: boolean;
};

type Props = {
  assignmentProps: AssignmentViewProps;
  isAssignmentsLoading: boolean;
  chapterId: string | null;
  workflowRecordState: WorkflowRecordState;
  getWorkflowRecordUserLabel: (userId: string) => string;
  loadMoreWorkflowRecords: () => Promise<void>;
};

export function ComicDetailWorkflowView({
  assignmentProps,
  isAssignmentsLoading,
  chapterId,
  workflowRecordState,
  getWorkflowRecordUserLabel,
  loadMoreWorkflowRecords,
}: Props): ReactElement {
  return (
    <WorkflowPanel
      assignmentPanel={
        <AssignmentGroup {...assignmentProps} isAssignmentsLoading={isAssignmentsLoading} />
      }
      recordList={
        <WorkflowRecordList
          chapterId={chapterId}
          state={workflowRecordState}
          getUserLabel={getWorkflowRecordUserLabel}
          onLoadMore={() => {
            void loadMoreWorkflowRecords();
          }}
        />
      }
    />
  );
}
