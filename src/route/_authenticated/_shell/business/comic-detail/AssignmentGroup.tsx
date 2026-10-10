import { type JSX, useRef, useState } from "react";
import clsx from "clsx";
import { Plus, UserMinus, UserPlus } from "lucide-react";
import type { WorkflowTransition } from "@/route/_authenticated/business/chapter/chapter-input";
import {
  canApplyWorkflowTransition,
  type ChapterInfo,
} from "@/route/_authenticated/business/chapter/chapter";
import type { AssignmentInfo } from "@/route/_authenticated/business/assignment/assignment";
import type { Role } from "@/route/business/identity/role";
import type { Result } from "@/shared/utility/result";
import type { WorkflowStatus } from "@/route/_authenticated/business/chapter/workflow";
import { ConfirmDialog } from "@/shared/component/ConfirmDialog";
import { AssignmentAvatarStack } from "@/route/_authenticated/_shell/business/comic-detail/AssignmentAvatarStack";
import { ASSIGNMENT_ROLE_DEFS } from "@/route/_authenticated/_shell/business/comic-detail/assignment-workflow";
import { TransitionDialog } from "@/route/_authenticated/_shell/business/comic-detail/TransitionDialog";
import { AssignmentActionButton as ActionButton } from "@/route/_authenticated/_shell/business/comic-detail/AssignmentActionButton";

type Props = {
  selectedChapter?: ChapterInfo | undefined;
  assignments: AssignmentInfo[];
  isAssignmentsLoading?: boolean | undefined;
  currentUserId: string;
  onTransiteWorkflow: (transition: WorkflowTransition) => Promise<Result<void>>;
  onRemoveAssignment?: ((userId: string, role: Role) => void) | undefined;
  onAddAssignment?: ((role: Role) => void) | undefined;
  onJoinRole?: ((role: Role) => void) | undefined;
  canJoinRole?: ((role: Role) => boolean) | undefined;
  isRoleJoining?: ((role: Role) => boolean) | undefined;
  onLeaveRole?: ((role: Role) => void) | undefined;
  canLeaveRole?: ((role: Role) => boolean) | undefined;
  isRoleLeaving?: ((role: Role) => boolean) | undefined;
  canOperateWorkflow?: boolean | undefined;
  canManageAssignments?: boolean | undefined;
};

type TransitionState = {
  label: string;
  status: WorkflowStatus;
  forwardTransition: WorkflowTransition | null;
  revertTransition: WorkflowTransition | null;
};

type RemoveState = {
  assignment: AssignmentInfo;
  role: Role;
  roleLabel: string;
};

type AssignmentRoleDef = (typeof ASSIGNMENT_ROLE_DEFS)[number];

type AssignmentRoleCardProps = Pick<
  Props,
  | "selectedChapter"
  | "assignments"
  | "isAssignmentsLoading"
  | "currentUserId"
  | "onRemoveAssignment"
  | "onAddAssignment"
  | "onJoinRole"
  | "canJoinRole"
  | "isRoleJoining"
  | "onLeaveRole"
  | "canLeaveRole"
  | "isRoleLeaving"
  | "canOperateWorkflow"
  | "canManageAssignments"
> & {
  roleDef: AssignmentRoleDef;
  onOpenTransition: (state: TransitionState) => void;
  onRequestRemoval: (assignment: AssignmentInfo, role: Role, roleLabel: string) => void;
};

function AssignmentRoleCard({
  roleDef,
  selectedChapter,
  assignments,
  isAssignmentsLoading,
  currentUserId,
  onRemoveAssignment,
  onAddAssignment,
  onJoinRole,
  canJoinRole,
  isRoleJoining,
  onLeaveRole,
  canLeaveRole,
  isRoleLeaving,
  canOperateWorkflow,
  canManageAssignments,
  onOpenTransition,
  onRequestRemoval,
}: AssignmentRoleCardProps): JSX.Element {
  const roleAssignments = assignments.filter((assignment) => roleDef.matches(assignment));
  const isCurrentUserAssigned = Boolean(
    currentUserId && roleAssignments.some((assignment) => assignment.userId === currentUserId),
  );
  const canOperateThisRole = canOperateWorkflow ? true : isCurrentUserAssigned;
  const status = selectedChapter ? roleDef.getStatus(selectedChapter) : ("unset" as WorkflowStatus);
  const statusLabel = workflowStatusLabel(status);
  const nextForward = selectedChapter && status !== "unset" ? roleDef.nextTransition(status) : null;
  const forwardTransition =
    canOperateThisRole &&
    selectedChapter &&
    nextForward &&
    canApplyWorkflowTransition(selectedChapter, nextForward)
      ? nextForward
      : null;
  const nextRevert = selectedChapter ? roleDef.prevRevertTransition(selectedChapter) : null;
  const revertTransition =
    canOperateThisRole &&
    selectedChapter &&
    nextRevert &&
    canApplyWorkflowTransition(selectedChapter, nextRevert)
      ? nextRevert
      : null;
  const hasTransition = Boolean(forwardTransition ?? revertTransition);
  const canJoin = canJoinRole?.(roleDef.addRole) ?? false;

  return (
    <div
      className={clsx(
        "group/stage flex min-h-12 min-w-0 items-center gap-2",
        "border-b border-r border-line-stone-200/80 px-2.5 py-1.5",
        "transition-colors duration-150",
        hasTransition && [
          "cursor-pointer hover:bg-surface-stone-100/90",
          "focus-visible:z-10 focus-visible:outline-2",
          "focus-visible:outline-outline-stone-400 focus-visible:outline-offset-[-2px]",
        ],
      )}
    >
      <span
        aria-hidden="true"
        className={clsx(
          "h-7 w-0.5 shrink-0 rounded-full transition-colors",
          status === "pending" && "bg-surface-slate-300",
          status === "ongoing" && "bg-surface-orange-300",
          status === "completed" && "bg-surface-emerald-400",
          status === "unset" && "bg-surface-slate-200",
        )}
      />
      {hasTransition ? (
        <button
          type="button"
          aria-label={`${roleDef.fullLabel}，${statusLabel}`}
          onClick={() => {
            onOpenTransition({
              label: roleDef.shortLabel,
              status,
              forwardTransition,
              revertTransition,
            });
          }}
          className={clsx(
            "w-8 shrink-0 text-left text-xs font-bold text-ink-stone-700",
            "focus-visible:outline-2 focus-visible:outline-border",
          )}
        >
          {roleDef.fullLabel}
        </button>
      ) : (
        <span className="w-8 shrink-0 text-xs font-bold text-ink-stone-700">
          {roleDef.fullLabel}
        </span>
      )}
      <span aria-hidden="true" className="h-5 w-px shrink-0 bg-surface-stone-200" />
      <div className="flex min-w-0 flex-1 items-center">
        <AssignmentAvatarStack
          assignments={roleAssignments}
          isLoading={isAssignmentsLoading}
          canRemove={canManageAssignments && Boolean(onRemoveAssignment)}
          onRequestRemove={(assignment) => {
            onRequestRemoval(assignment, roleDef.addRole, roleDef.fullLabel);
          }}
        />
      </div>
      <AssignmentRoleActions
        roleDef={roleDef}
        canManageAssignments={canManageAssignments}
        canJoin={canJoin}
        isRoleJoining={isRoleJoining}
        onAddAssignment={onAddAssignment}
        onJoinRole={onJoinRole}
        canLeaveRole={canLeaveRole}
        onLeaveRole={onLeaveRole}
        isRoleLeaving={isRoleLeaving}
      />
    </div>
  );
}

type AssignmentRoleActionsProps = Pick<
  Props,
  | "canManageAssignments"
  | "isRoleJoining"
  | "onAddAssignment"
  | "onJoinRole"
  | "canLeaveRole"
  | "onLeaveRole"
  | "isRoleLeaving"
> & { roleDef: AssignmentRoleDef; canJoin: boolean };

function AssignmentRoleActions({
  roleDef,
  canManageAssignments,
  canJoin,
  isRoleJoining,
  onAddAssignment,
  onJoinRole,
  canLeaveRole,
  onLeaveRole,
  isRoleLeaving,
}: AssignmentRoleActionsProps): JSX.Element {
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      {canManageAssignments && onAddAssignment && (
        <ActionButton
          label={`分配${roleDef.fullLabel}成员`}
          onClick={() => {
            onAddAssignment(roleDef.addRole);
          }}
        >
          <Plus size={13} strokeWidth={2.25} />
        </ActionButton>
      )}
      {canJoin && onJoinRole && (
        <ActionButton
          label={`加入${roleDef.fullLabel}分工`}
          disabled={isRoleJoining?.(roleDef.addRole)}
          onClick={() => {
            onJoinRole(roleDef.addRole);
          }}
        >
          <UserPlus size={13} strokeWidth={2.25} />
        </ActionButton>
      )}
      {!canJoin && canLeaveRole?.(roleDef.addRole) && onLeaveRole && (
        <ActionButton
          label={`退出${roleDef.fullLabel}分工`}
          danger
          disabled={isRoleLeaving?.(roleDef.addRole)}
          onClick={() => {
            onLeaveRole(roleDef.addRole);
          }}
        >
          <UserMinus size={13} strokeWidth={2.25} />
        </ActionButton>
      )}
    </div>
  );
}

function assignmentName(assignment: AssignmentInfo): string {
  return assignment.user?.name ?? assignment.userId;
}

function workflowStatusLabel(status: WorkflowStatus): string {
  if (status === "pending") return "未开始";
  if (status === "ongoing") return "进行中";
  if (status === "completed") return "已完成";
  return "未配置";
}

export function AssignmentGroup({
  selectedChapter,
  assignments,
  isAssignmentsLoading = false,
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
}: Props): JSX.Element {
  const [transitionState, setTransitionState] = useState<TransitionState | null>(null);
  const [removalState, setRemovalState] = useState<RemoveState | null>(null);
  const transitioningRef = useRef(false);

  async function handleTransition(transition: WorkflowTransition): Promise<void> {
    if (transitioningRef.current) return;
    transitioningRef.current = true;
    setTransitionState(null);
    try {
      await onTransiteWorkflow(transition);
    } catch (error) {
      console.error("[AssignmentGroup] 流程操作失败:", error);
    } finally {
      transitioningRef.current = false;
    }
  }

  return (
    <section aria-label="章节分工" className="relative bg-transparent p-4">
      <span
        aria-hidden="true"
        className={clsx(
          "absolute bottom-0 left-1/2 h-[1.5px] w-4/5 -translate-x-1/2",
          "bg-surface-stone-200",
        )}
      />
      <div className="grid grid-cols-2 border-l border-t border-line-stone-200/80 rounded-sm">
        {ASSIGNMENT_ROLE_DEFS.map((roleDef) => (
          <AssignmentRoleCard
            key={roleDef.addRole}
            roleDef={roleDef}
            selectedChapter={selectedChapter}
            assignments={assignments}
            isAssignmentsLoading={isAssignmentsLoading}
            currentUserId={currentUserId}
            onRemoveAssignment={onRemoveAssignment}
            onAddAssignment={onAddAssignment}
            onJoinRole={onJoinRole}
            canJoinRole={canJoinRole}
            isRoleJoining={isRoleJoining}
            onLeaveRole={onLeaveRole}
            canLeaveRole={canLeaveRole}
            isRoleLeaving={isRoleLeaving}
            canOperateWorkflow={canOperateWorkflow}
            canManageAssignments={canManageAssignments}
            onOpenTransition={(state) => {
              if (!transitioningRef.current) setTransitionState(state);
            }}
            onRequestRemoval={(assignment, role, roleLabel) => {
              setRemovalState({ assignment, role, roleLabel });
            }}
          />
        ))}
      </div>

      {transitionState && (
        <TransitionDialog
          label={transitionState.label}
          status={transitionState.status}
          forwardTransition={transitionState.forwardTransition}
          revertTransition={transitionState.revertTransition}
          onConfirm={(transition) => {
            void handleTransition(transition);
          }}
          onCancel={() => {
            setTransitionState(null);
          }}
        />
      )}

      {removalState && onRemoveAssignment && (
        <ConfirmDialog
          title="移除成员"
          description={
            `确认移除「${assignmentName(removalState.assignment)}」的` +
            `${removalState.roleLabel}分工？`
          }
          confirmLabel="移除"
          onConfirm={() => {
            onRemoveAssignment(removalState.assignment.userId, removalState.role);
            setRemovalState(null);
          }}
          onCancel={() => {
            setRemovalState(null);
          }}
        />
      )}
    </section>
  );
}
