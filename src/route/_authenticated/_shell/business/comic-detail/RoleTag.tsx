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

const STATUS_CONFIG: Record<WorkflowStatus, StatusConfig> = {
  pending: {
    labelText: "text-muted-foreground",
    hoverLabelText: "group-hover:text-muted-foreground",
    barColor: "bg-border",
  },
  ongoing: {
    labelText: "text-status-warning",
    hoverLabelText: "group-hover:text-status-warning",
    barColor: "bg-status-warning",
  },
  completed: {
    labelText: "text-status-success",
    hoverLabelText: "group-hover:text-status-success",
    barColor: "bg-status-success",
  },
  unset: {
    labelText: "text-muted-foreground",
    hoverLabelText: "group-hover:text-muted-foreground",
    barColor: "bg-surface-hover",
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
          "bg-surface-panel",
          onClickable && [
            "cursor-pointer hover:bg-surface-hover",
            "focus-visible:outline-2 focus-visible:outline-border",
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
        <div className="flex flex-1 items-center flex-wrap gap-1.5 min-h-5">
          {assignments.length === 0 ? (
            <span className="text-[10px] text-muted-foreground italic leading-none">未分配</span>
          ) : (
            assignments.map((a) => (
              <UserTag
                key={a.userId}
                userId={a.userId}
                name={a.user?.name ?? a.userId}
                role={role}
                onRemove={onRemoveUser}
              />
            ))
          )}
        </div>

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
              "text-muted-foreground/70 hover:text-foreground hover:bg-surface-hover/80",
              "border border-transparent hover:border-border",
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
              "text-muted-foreground/70 hover:text-foreground hover:bg-surface-hover/80",
              "border border-transparent hover:border-border",
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
              "text-muted-foreground/70 hover:text-foreground hover:bg-surface-hover/80",
              "border border-transparent hover:border-border",
              "disabled:opacity-60 disabled:cursor-not-allowed",
            )}
            title="退出当前分工"
          >
            <UserMinus size={12} strokeWidth={2.5} />
          </button>
        )}

        {/* Nav-style indicator pill */}
        <div
          className={clsx(
            "absolute left-2 top-1/2 -translate-y-1/2",
            "w-1 h-3.5 rounded-full shrink-0",
            cfg.barColor,
          )}
        />
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
