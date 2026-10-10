import { type JSX, useState, useRef } from "react";
import clsx from "clsx";
import { Plus, UserMinus, UserPlus } from "lucide-react";
import type { WorkflowTransition } from "@/route/_authenticated/business/chapter/chapter-input";
import type { WorkflowStatus } from "@/route/_authenticated/business/chapter/workflow";
import type { AssignmentInfo } from "@/route/_authenticated/business/assignment/assignment";
import type { Result } from "@/shared/utility/result";
import type { Role } from "@/route/business/identity/role";
import { UserTag } from "@/route/_authenticated/_shell/business/comic-detail/UserTag";
import { ConfirmDialog } from "@/shared/component/ConfirmDialog";
import { TransitionDialog } from "@/route/_authenticated/_shell/business/comic-detail/TransitionDialog";

type Props = {
  label: string;
  role: Role;
  assignments: AssignmentInfo[];
  status: WorkflowStatus;
  /**
  Forward (advance) transition available, or null
  */
  forwardTransition: WorkflowTransition | null;
  /**
  Revert transition available, or null
  */
  revertTransition: WorkflowTransition | null;
  /**
  Whether the tag should appear clickable (has at least one transition)
  */
  onClickable: boolean;
  onTransiteWorkflow: (t: WorkflowTransition) => Promise<Result<void>>;
  onRemoveUser?: ((userId: string, role: Role) => void) | undefined;
  /**
  Called to open the MemberSelectorModal for this role
  */
  onAddUser?: (() => void) | undefined;
  onJoinSelf?: (() => void) | undefined;
  canJoinSelf?: boolean | undefined;
  isJoiningSelf?: boolean | undefined;
  onLeaveSelf?: (() => void) | undefined;
  canLeaveSelf?: boolean | undefined;
  isLeavingSelf?: boolean | undefined;
};

type StatusConfig = {
  labelText: string;
  hoverLabelText: string;
  barColor: string;
};

type RoleTagAssignmentsProps = {
  assignments: AssignmentInfo[];
  role: Role;
  onRemoveUser?: Props["onRemoveUser"];
};

function RoleTagAssignments({
  assignments,
  role,
  onRemoveUser,
}: RoleTagAssignmentsProps): JSX.Element {
  return (
    <div className="flex flex-1 items-center flex-wrap gap-1.5 min-h-5">
      {assignments.length === 0 ? (
        <span className="text-[10px] text-text-muted-cool italic leading-none">未分配</span>
      ) : (
        assignments.map((assignment) => (
          <UserTag
            key={assignment.userId}
            userId={assignment.userId}
            name={assignment.user?.name ?? assignment.userId}
            role={role}
            onRemove={onRemoveUser}
          />
        ))
      )}
    </div>
  );
}

function RoleTagStatusIndicator({ barColor }: { barColor: string }): JSX.Element {
  return (
    <div
      className={clsx(
        "absolute left-2 top-1/2 -translate-y-1/2",
        "w-1 h-3.5 rounded-full shrink-0",
        barColor,
      )}
    />
  );
}

const STATUS_CONFIG: Record<WorkflowStatus, StatusConfig> = {
  pending: {
    labelText: "text-text-muted-cool",
    hoverLabelText: "group-hover:text-text-muted-cool",
    barColor: "bg-surface-slate-300",
  },
  ongoing: {
    labelText: "text-text-warning",
    hoverLabelText: "group-hover:text-ink-orange-600",
    barColor: "bg-surface-orange-300",
  },
  completed: {
    labelText: "text-text-emerald",
    hoverLabelText: "group-hover:text-text-emerald",
    barColor: "bg-surface-emerald-400",
  },
  unset: {
    labelText: "text-text-muted-cool",
    hoverLabelText: "group-hover:text-text-muted-cool",
    barColor: "bg-surface-slate-200",
  },
};

export function RoleTag({
  label,
  role,
  assignments,
  status,
  forwardTransition,
  revertTransition,
  onClickable,
  onTransiteWorkflow,
  onRemoveUser,
  onAddUser,
  onJoinSelf,
  canJoinSelf = false,
  isJoiningSelf = false,
  onLeaveSelf,
  canLeaveSelf = false,
  isLeavingSelf = false,
}: Props): JSX.Element {
  const cfg = STATUS_CONFIG[status];
  const [showTransitionDialog, setShowTransitionDialog] = useState(false);
  const [pendingLeave, setPendingLeave] = useState(false);
  const transitioningRef = useRef(false);

  const handleTransition = async (transition: WorkflowTransition): Promise<void> => {
    if (transitioningRef.current) {
      return;
    }
    transitioningRef.current = true;
    setShowTransitionDialog(false);
    try {
      await onTransiteWorkflow(transition);
    } catch (error) {
      console.error("[RoleTag] 流程操作失败:", error);
    } finally {
      transitioningRef.current = false;
    }
  };

  return (
    <>
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div
        role={onClickable ? "button" : undefined}
        {...(onClickable ? { tabIndex: 0 } : {})}
        onClick={() => {
          if (onClickable && !transitioningRef.current) {
            setShowTransitionDialog(true);
          }
        }}
        onKeyDown={(event) => {
          if (
            !(
              onClickable &&
              !transitioningRef.current &&
              (event.key === "Enter" || event.key === " ")
            )
          ) {
            return;
          }

          event.preventDefault();
          setShowTransitionDialog(true);
        }}
        className={clsx(
          "relative flex items-center min-w-0 w-full group",
          "pl-4 pr-2 py-1 gap-3",
          "transition-all duration-200",
          "bg-surface-white",
          onClickable && [
            "cursor-pointer hover:bg-surface-stone-100",
            "focus-visible:outline-2 focus-visible:outline-outline-stone-400",
            "focus-visible:outline-offset-[-2px]",
          ],
        )}
      >
        {/* Label */}
        <span
          className={clsx(
            "pl-1.5 text-sm font-black tracking-widest uppercase",
            "shrink-0 leading-none w-6 text-left",
            "transition-colors duration-300",
            cfg.labelText,
            cfg.hoverLabelText,
          )}
        >
          {label}
        </span>

        {/* User tags */}
        <RoleTagAssignments assignments={assignments} role={role} onRemoveUser={onRemoveUser} />

        {/* Add user button */}
        {onAddUser && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddUser();
            }}
            className={clsx(
              "shrink-0 w-5 h-5 flex items-center justify-center rounded-sm",
              "text-text-muted-cool hover:text-ink-slate-700 hover:bg-surface-slate-100/80",
              "border border-transparent hover:border-line-slate-200",
            )}
            title="添加成员"
          >
            <Plus size={12} strokeWidth={2.5} />
          </button>
        )}

        {canJoinSelf && onJoinSelf && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onJoinSelf();
            }}
            disabled={isJoiningSelf}
            className={clsx(
              "shrink-0 w-5 h-5 flex items-center justify-center rounded-sm",
              "text-text-muted-cool hover:text-ink-slate-700 hover:bg-surface-slate-100/80",
              "border border-transparent hover:border-line-slate-200",
              "disabled:opacity-60 disabled:cursor-not-allowed",
            )}
            title="加入当前分工"
          >
            <UserPlus size={12} strokeWidth={2.5} />
          </button>
        )}

        {!canJoinSelf && canLeaveSelf && onLeaveSelf && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setPendingLeave(true);
            }}
            disabled={isLeavingSelf}
            className={clsx(
              "shrink-0 w-5 h-5 flex items-center justify-center rounded-sm",
              "text-text-muted-cool hover:text-ink-slate-700 hover:bg-surface-slate-100/80",
              "border border-transparent hover:border-line-slate-200",
              "disabled:opacity-60 disabled:cursor-not-allowed",
            )}
            title="退出当前分工"
          >
            <UserMinus size={12} strokeWidth={2.5} />
          </button>
        )}

        {/* Nav-style indicator pill */}
        <RoleTagStatusIndicator barColor={cfg.barColor} />
      </div>

      {showTransitionDialog && (
        <TransitionDialog
          label={label}
          status={status}
          forwardTransition={forwardTransition}
          revertTransition={revertTransition}
          onConfirm={(transition) => {
            void handleTransition(transition);
          }}
          onCancel={() => {
            setShowTransitionDialog(false);
          }}
        />
      )}

      {pendingLeave && onLeaveSelf && (
        <ConfirmDialog
          title="确认退出分工"
          description={`确定要退出「${label}」分工吗？`}
          confirmLabel="退出"
          onConfirm={() => {
            setPendingLeave(false);
            onLeaveSelf();
          }}
          onCancel={() => {
            setPendingLeave(false);
          }}
        />
      )}
    </>
  );
}
