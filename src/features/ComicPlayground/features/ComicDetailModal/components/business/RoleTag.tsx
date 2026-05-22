import { useState, useRef } from "react";
import clsx from "clsx";
import { Plus, UserMinus, UserPlus } from "lucide-react";
import type { WorkflowTransition } from "@/features/ComicPlayground/types/chapter";
import type { WorkflowStatus } from "@/types/workflow";
import type { AssignmentInfo } from "@/types/assignment";
import type { Result } from "@/types/utils/result";
import type { Role } from "@/types/role";
import UserTag from "./UserTag";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

type Props = {
  label: string;
  role: Role;
  assignments: AssignmentInfo[];
  status: WorkflowStatus;
  // The transition to fire when clicking this tag
  transition: WorkflowTransition | null;
  onTransiteWorkflow: (t: WorkflowTransition) => Promise<Result<void>>;
  onRemoveUser?: (userId: string, role: Role) => void;
  // Called to open the MemberSelectorModal for this role
  onAddUser?: () => void;
  onJoinSelf?: () => void;
  canJoinSelf?: boolean;
  isJoiningSelf?: boolean;
  onLeaveSelf?: () => void;
  canLeaveSelf?: boolean;
  isLeavingSelf?: boolean;
};

type StatusConfig = {
  labelText: string;
  hoverLabelText: string;
  barColor: string;
  hoverGradient: string;
};

const STATUS_CONFIG: Record<WorkflowStatus, StatusConfig> = {
  pending: {
    labelText: "text-slate-300",
    hoverLabelText: "group-hover:text-slate-500",
    barColor: "bg-slate-300",
    hoverGradient: "bg-gradient-to-r from-slate-100/40 to-transparent",
  },
  ongoing: {
    labelText: "text-orange-300",
    hoverLabelText: "group-hover:text-orange-600",
    barColor: "bg-orange-300",
    hoverGradient: "bg-gradient-to-r from-orange-100/50 to-transparent",
  },
  completed: {
    labelText: "text-emerald-400",
    hoverLabelText: "group-hover:text-emerald-600",
    barColor: "bg-emerald-400",
    hoverGradient: "bg-gradient-to-r from-emerald-100/50 to-transparent",
  },
  unset: {
    labelText: "text-slate-200",
    hoverLabelText: "group-hover:text-slate-400",
    barColor: "bg-slate-200",
    hoverGradient: "bg-gradient-to-r from-slate-50/20 to-transparent",
  },
};

export default function RoleTag({
  label,
  role,
  assignments,
  status,
  transition,
  onTransiteWorkflow,
  onRemoveUser,
  onAddUser,
  onJoinSelf,
  canJoinSelf = false,
  isJoiningSelf = false,
  onLeaveSelf,
  canLeaveSelf = false,
  isLeavingSelf = false,
}: Props) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const transitioningRef = useRef(false);
  const [pendingLeave, setPendingLeave] = useState(false);

  const handleClick = () => {
    if (!transition || transitioningRef.current) return;
    transitioningRef.current = true;
    onTransiteWorkflow(transition)
      .catch((err) => {
        console.error("[RoleTag] 推进流程失败:", err);
      })
      .finally(() => {
        transitioningRef.current = false;
      });
  };

  return (
    <div
      onClick={handleClick}
      className={clsx(
        "relative flex items-center min-w-0 w-full group",
        "pl-4 pr-2 py-1 gap-3",
        "transition-all duration-200",
        "bg-white",
        transition && "cursor-pointer",
      )}
    >
      {/* Hover gradient overlay */}
      <div
        className={clsx(
          "absolute inset-0 opacity-0 transition-opacity duration-300",
          "group-hover:opacity-100 pointer-events-none",
          cfg.hoverGradient,
        )}
      />

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
          <span className="text-[10px] text-slate-300 italic leading-none">
            未分配
          </span>
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
          onClick={(e) => {
            e.stopPropagation();
            onAddUser();
          }}
          className={clsx(
            "shrink-0 w-5 h-5 flex items-center justify-center rounded-sm",
            "text-slate-300/70 hover:text-slate-700 hover:bg-slate-100/80",
            "border border-transparent hover:border-slate-200",
          )}
          title="添加成员"
        >
          <Plus size={12} strokeWidth={2.5} />
        </button>
      )}

      {canJoinSelf && onJoinSelf && (
        <button
          onClick={(event) => {
            event.stopPropagation();
            onJoinSelf();
          }}
          disabled={isJoiningSelf}
          className={clsx(
            "shrink-0 w-5 h-5 flex items-center justify-center rounded-sm",
            "text-slate-300/70 hover:text-slate-700 hover:bg-slate-100/80",
            "border border-transparent hover:border-slate-200",
            "disabled:opacity-60 disabled:cursor-not-allowed",
          )}
          title="加入当前分工"
        >
          <UserPlus size={12} strokeWidth={2.5} />
        </button>
      )}

      {!canJoinSelf && canLeaveSelf && onLeaveSelf && (
        <button
          onClick={(event) => {
            event.stopPropagation();
            setPendingLeave(true);
          }}
          disabled={isLeavingSelf}
          className={clsx(
            "shrink-0 w-5 h-5 flex items-center justify-center rounded-sm",
            "text-slate-300/70 hover:text-slate-700 hover:bg-slate-100/80",
            "border border-transparent hover:border-slate-200",
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

      {pendingLeave && onLeaveSelf && (
        <ConfirmDialog
          title="确认退出分工"
          description={`确定要退出「${label}」分工吗？`}
          confirmLabel="退出"
          onConfirm={() => {
            setPendingLeave(false);
            onLeaveSelf();
          }}
          onCancel={() => setPendingLeave(false)}
        />
      )}
    </div>
  );
}
