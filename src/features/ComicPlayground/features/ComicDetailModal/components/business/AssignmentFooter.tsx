import { useState } from "react";
import clsx from "clsx";
import { ChevronUp, ChevronDown } from "lucide-react";
import type { WorkflowTransition } from "@/features/ComicPlayground/types/chapter";
import { canApplyWorkflowTransition } from "@/types/chapter";
import type { ChapterInfo } from "@/types";
import type { AssignmentInfo } from "@/types/assignment";
import type { Role } from "@/types/role";
import type { WorkflowStatus } from "@/types/workflow";
import type { Result } from "@/types/utils/result";
import { hasRole } from "@/types/role";
import { ASSIGNMENT_ROLE_DEFS } from "./assignmentWorkflow";
import QuickWorkflowActions from "./QuickWorkflowActions";
import RoleTag from "./RoleTag";

type Props = {
  selectedChapter?: ChapterInfo;
  assignments: AssignmentInfo[];
  currentUserId?: string | null;
  onTransiteWorkflow: (transition: WorkflowTransition) => Promise<Result<void>>;
  onRemoveAssignment?: (userId: string, role: Role) => void;
  onAddAssignment?: (role: Role) => void;
  onJoinRole?: (role: Role) => void;
  canJoinRole?: (role: Role) => boolean;
  isRoleJoining?: (role: Role) => boolean;
  onLeaveRole?: (role: Role) => void;
  canLeaveRole?: (role: Role) => boolean;
  isRoleLeaving?: (role: Role) => boolean;
  canOperateWorkflow?: boolean;
  canManageAssignments?: boolean;
};

export default function AssignmentFooter({
  selectedChapter,
  assignments,
  currentUserId,
  onTransiteWorkflow,
  onRemoveAssignment,
  onAddAssignment,
  onJoinRole,
  canJoinRole,
  isRoleJoining,
  onLeaveRole,
  canLeaveRole,
  isRoleLeaving,
  canOperateWorkflow = false,
  canManageAssignments = false,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="flex flex-col border-t border-slate-200 bg-white shrink-0">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={clsx(
          "w-full h-5 flex items-center justify-center",
          "text-slate-300 hover:text-slate-500 hover:bg-slate-100/50",
          "transition-colors",
        )}
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4" strokeWidth={2} />
        ) : (
          <ChevronUp className="w-4 h-4 stone-800" strokeWidth={2} />
        )}
      </button>

      {/* Expanded Content */}
      <div
        className={clsx(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <div className="px-4 pt-1 pb-3 flex flex-col gap-1 relative">
          {/* Admin header */}
          {(() => {
            const admins = assignments.filter((a) => hasRole(a, "admin"));
            if (admins.length === 0) return null;
            return (
              <div className="flex items-center gap-2 mb-1">
                <div className="flex-1 h-px bg-gradient-to-r from-stone-300 to-transparent" />
                <span className="text-xs text-stone-400 shrink-0">
                  总管：{admins.map((a) => a.user?.name ?? a.userId).join("、")}
                </span>
              </div>
            );
          })()}
          {ASSIGNMENT_ROLE_DEFS.map((roleDef) => {
            const roleAssignments = assignments.filter(roleDef.matches);
            const isCurrentUserAssigned = !!(
              currentUserId &&
              roleAssignments.some((a) => a.userId === currentUserId)
            );
            const canOperateThisRole =
              canOperateWorkflow || isCurrentUserAssigned;
            const status = selectedChapter
              ? roleDef.getStatus(selectedChapter)
              : ("unset" as WorkflowStatus);

            // forward transition
            const nextForward =
              selectedChapter && status !== "unset"
                ? roleDef.nextTransition(status)
                : null;
            const forwardTransition =
              canOperateThisRole &&
              selectedChapter &&
              nextForward &&
              canApplyWorkflowTransition(selectedChapter, nextForward)
                ? nextForward
                : null;

            // revert transition
            const nextRevert =
              selectedChapter
                ? roleDef.prevRevertTransition(selectedChapter)
                : null;
            const revertTransition =
              canOperateThisRole &&
              selectedChapter &&
              nextRevert &&
              canApplyWorkflowTransition(selectedChapter, nextRevert)
                ? nextRevert
                : null;

            const hasAnyTransition =
              forwardTransition != null || revertTransition != null;

            return (
              <RoleTag
                key={roleDef.shortLabel}
                label={roleDef.shortLabel}
                role={roleDef.addRole}
                assignments={roleAssignments}
                status={status}
                forwardTransition={forwardTransition}
                revertTransition={revertTransition}
                onClickable={hasAnyTransition}
                onTransiteWorkflow={onTransiteWorkflow}
                onRemoveUser={canManageAssignments ? onRemoveAssignment : undefined}
                onAddUser={
                  canManageAssignments && onAddAssignment
                    ? () => onAddAssignment(roleDef.addRole)
                    : undefined
                }
                canJoinSelf={
                  canJoinRole ? canJoinRole(roleDef.addRole) : false
                }
                isJoiningSelf={
                  isRoleJoining ? isRoleJoining(roleDef.addRole) : false
                }
                onJoinSelf={
                  onJoinRole ? () => onJoinRole(roleDef.addRole) : undefined
                }
                canLeaveSelf={
                  canLeaveRole ? canLeaveRole(roleDef.addRole) : false
                }
                isLeavingSelf={
                  isRoleLeaving ? isRoleLeaving(roleDef.addRole) : false
                }
                onLeaveSelf={
                  onLeaveRole ? () => onLeaveRole(roleDef.addRole) : undefined
                }
              />
            );
          })}
          <QuickWorkflowActions
            selectedChapter={selectedChapter}
            assignments={assignments}
            currentUserId={currentUserId}
            onTransiteWorkflow={onTransiteWorkflow}
          />
        </div>
      </div>

    </div>
  );
}

