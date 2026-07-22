import { useRef, useState, type ReactNode } from "react";
import clsx from "clsx";
import { Plus, UserMinus, UserPlus } from "lucide-react";
import type { WorkflowTransition } from "@/features/ComicPlayground/types/chapter";
import { canApplyWorkflowTransition, type ChapterInfo } from "@/types/chapter";
import type { AssignmentInfo } from "@/types/assignment";
import { hasRole, type Role } from "@/types/role";
import type { Result } from "@/types/utils/result";
import type { WorkflowStatus } from "@/types/workflow";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import AssignmentAvatarStack from "./AssignmentAvatarStack";
import { ASSIGNMENT_ROLE_DEFS } from "./assignmentWorkflow";
import TransitionDialog from "./TransitionDialog";

type Props = {
  selectedChapter?: ChapterInfo;
  assignments: AssignmentInfo[];
  isAssignmentsLoading?: boolean;
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

type ActionButtonProps = {
  label: string;
  disabled?: boolean;
  danger?: boolean;
  onClick: () => void;
  children: ReactNode;
};

function ActionButton({
  label,
  disabled = false,
  danger = false,
  onClick,
  children,
}: ActionButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      onKeyDown={(event) => event.stopPropagation()}
      className={clsx(
        "flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border",
        "border-transparent transition-colors",
        danger
          ? "text-rose-300 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500"
          : [
              "text-stone-300 hover:border-stone-200",
              "hover:bg-stone-100 hover:text-stone-600",
            ],
        "focus-visible:outline-2 focus-visible:outline-primary/60",
        "disabled:cursor-not-allowed disabled:opacity-45",
      )}
    >
      {children}
    </button>
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

export default function AssignmentGroup({
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
}: Props) {
  const [transitionState, setTransitionState] =
    useState<TransitionState | null>(null);
  const [removeState, setRemoveState] = useState<RemoveState | null>(null);
  const transitioningRef = useRef(false);
  const admins = assignments.filter((assignment) =>
    hasRole(assignment, "admin"),
  );

  async function handleTransition(transition: WorkflowTransition) {
    if (transitioningRef.current) return;
    transitioningRef.current = true;
    setTransitionState(null);
    try {
      await onTransiteWorkflow(transition);
    } catch (err) {
      console.error("[AssignmentGroup] 流程操作失败:", err);
    } finally {
      transitioningRef.current = false;
    }
  }

  return (
    <section
      aria-labelledby="assignment-group-title"
      className="relative z-20 border-b border-stone-200 bg-stone-50 px-4 pb-3 pt-2.5"
    >
      <div className="mb-2 flex min-h-8 items-center gap-2">
        <div className="h-px flex-1 bg-stone-200" />
        <span className="shrink-0 text-sm font-medium text-stone-400">
          总管
        </span>
        <AssignmentAvatarStack
          assignments={admins}
          isLoading={isAssignmentsLoading}
          showEmpty={false}
        />
      </div>

      <div className="grid grid-cols-2 border-l border-t border-stone-200/80 rounded-sm">
        {ASSIGNMENT_ROLE_DEFS.map((roleDef) => {
          const roleAssignments = assignments.filter(roleDef.matches);
          const isCurrentUserAssigned = !!(
            currentUserId &&
            roleAssignments.some(
              (assignment) => assignment.userId === currentUserId,
            )
          );
          const canOperateThisRole =
            canOperateWorkflow || isCurrentUserAssigned;
          const status = selectedChapter
            ? roleDef.getStatus(selectedChapter)
            : ("unset" as WorkflowStatus);
          const statusLabel = workflowStatusLabel(status);
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
          const nextRevert = selectedChapter
            ? roleDef.prevRevertTransition(selectedChapter)
            : null;
          const revertTransition =
            canOperateThisRole &&
            selectedChapter &&
            nextRevert &&
            canApplyWorkflowTransition(selectedChapter, nextRevert)
              ? nextRevert
              : null;
          const hasTransition = !!(forwardTransition || revertTransition);
          const canJoin = canJoinRole?.(roleDef.addRole) ?? false;

          const openTransition = () => {
            if (!hasTransition || transitioningRef.current) return;
            setTransitionState({
              label: roleDef.shortLabel,
              status,
              forwardTransition,
              revertTransition,
            });
          };

          return (
            <div
              key={roleDef.addRole}
              role={hasTransition ? "button" : undefined}
              tabIndex={hasTransition ? 0 : undefined}
              aria-label={`${roleDef.fullLabel}，${statusLabel}`}
              onClick={openTransition}
              onKeyDown={(event) => {
                if (event.target !== event.currentTarget) return;
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openTransition();
                }
              }}
              className={clsx(
                "group/stage flex min-h-12 min-w-0 items-center gap-2",
                "border-b border-r border-stone-200/80 px-2.5 py-1.5",
                "transition-colors duration-150",
                hasTransition && [
                  "cursor-pointer hover:bg-stone-100/90",
                  "focus-visible:z-10 focus-visible:outline-2",
                  "focus-visible:outline-stone-400 focus-visible:outline-offset-[-2px]",
                ],
              )}
            >
              <span
                aria-hidden="true"
                className={clsx(
                  "h-7 w-0.5 shrink-0 rounded-full transition-colors",
                  status === "pending" && "bg-slate-300",
                  status === "ongoing" && "bg-orange-300",
                  status === "completed" && "bg-emerald-400",
                  status === "unset" && "bg-slate-200",
                )}
              />
              <span className="w-8 shrink-0 text-xs font-bold text-stone-700">
                {roleDef.fullLabel}
              </span>
              <span
                aria-hidden="true"
                className="h-5 w-px shrink-0 bg-stone-200"
              />
              <div className="flex min-w-0 flex-1 items-center">
                <AssignmentAvatarStack
                  assignments={roleAssignments}
                  isLoading={isAssignmentsLoading}
                  canRemove={canManageAssignments && !!onRemoveAssignment}
                  onRequestRemove={(assignment) => {
                    setRemoveState({
                      assignment,
                      role: roleDef.addRole,
                      roleLabel: roleDef.fullLabel,
                    });
                  }}
                />
              </div>

              <div className="flex shrink-0 items-center gap-0.5">
                {canManageAssignments && onAddAssignment && (
                  <ActionButton
                    label={`分配${roleDef.fullLabel}成员`}
                    onClick={() => onAddAssignment(roleDef.addRole)}
                  >
                    <Plus size={13} strokeWidth={2.25} />
                  </ActionButton>
                )}
                {canJoin && onJoinRole && (
                  <ActionButton
                    label={`加入${roleDef.fullLabel}分工`}
                    disabled={isRoleJoining?.(roleDef.addRole)}
                    onClick={() => onJoinRole(roleDef.addRole)}
                  >
                    <UserPlus size={13} strokeWidth={2.25} />
                  </ActionButton>
                )}
                {!canJoin && canLeaveRole?.(roleDef.addRole) && onLeaveRole && (
                  <ActionButton
                    label={`退出${roleDef.fullLabel}分工`}
                    danger
                    disabled={isRoleLeaving?.(roleDef.addRole)}
                    onClick={() => onLeaveRole(roleDef.addRole)}
                  >
                    <UserMinus size={13} strokeWidth={2.25} />
                  </ActionButton>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {transitionState && (
        <TransitionDialog
          label={transitionState.label}
          status={transitionState.status}
          forwardTransition={transitionState.forwardTransition}
          revertTransition={transitionState.revertTransition}
          onConfirm={handleTransition}
          onCancel={() => setTransitionState(null)}
        />
      )}

      {removeState && (
        <ConfirmDialog
          title="移除成员"
          description={
            `确认移除「${assignmentName(removeState.assignment)}」的` +
            `${removeState.roleLabel}分工？`
          }
          confirmLabel="移除"
          onConfirm={() => {
            onRemoveAssignment?.(
              removeState.assignment.userId,
              removeState.role,
            );
            setRemoveState(null);
          }}
          onCancel={() => setRemoveState(null)}
        />
      )}
    </section>
  );
}
