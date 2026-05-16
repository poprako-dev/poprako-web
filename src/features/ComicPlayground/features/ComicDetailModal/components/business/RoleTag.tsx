import { useRef } from "react";
import clsx from "clsx";
import { Plus, UserMinus, UserPlus } from "lucide-react";
import type { WorkflowTransition } from "@/features/ComicPlayground/types/chapter";
import type { WorkflowStatus } from "@/types/workflow";
import type { AssignmentInfo } from "@/types/assignment";
import type { Result } from "@/types/utils/result";
import type { Role } from "@/types/role";
import UserTag from "./UserTag";

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
  border: string;
  hoverBorder: string;
  bg: string;
  hoverBg: string;
  labelText: string;
  bottomBar: string;
};

const STATUS_CONFIG: Record<WorkflowStatus, StatusConfig> = {
  pending: {
    border: "border-slate-100",
    hoverBorder: "hover:border-slate-300",
    bg: "bg-white",
    hoverBg: "hover:bg-slate-50/60",
    labelText: "text-slate-300",
    bottomBar: "bg-slate-100",
  },
  ongoing: {
    border: "border-orange-100",
    hoverBorder: "hover:border-orange-300",
    bg: "bg-orange-50/40",
    hoverBg: "hover:bg-orange-50/80",
    labelText: "text-orange-300",
    bottomBar: "bg-orange-200",
  },
  completed: {
    border: "border-emerald-100",
    hoverBorder: "hover:border-emerald-300",
    bg: "bg-emerald-50/50",
    hoverBg: "hover:bg-emerald-50/80",
    labelText: "text-emerald-400",
    bottomBar: "bg-emerald-200",
  },
  unset: {
    border: "border-slate-100",
    hoverBorder: "hover:border-slate-300",
    bg: "bg-white",
    hoverBg: "hover:bg-slate-50/60",
    labelText: "text-slate-200",
    bottomBar: "bg-slate-50",
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
        "relative flex items-center min-w-0 w-full",
        "rounded-xs border pl-4 pr-2 py-1 gap-3",
        "transition-all duration-200 overflow-hidden",
        transition && "cursor-pointer",
        cfg.border,
        cfg.hoverBorder,
        cfg.bg,
        cfg.hoverBg,
      )}
    >
      {/* Label */}
      <span
        className={clsx(
          "text-[10px] font-black tracking-widest uppercase",
          "italic shrink-0 leading-none w-6 text-left",
          cfg.labelText,
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
            "text-slate-300 hover:text-slate-600 hover:bg-slate-100/80",
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
            "text-slate-300 hover:text-slate-600 hover:bg-slate-100/80",
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
            onLeaveSelf();
          }}
          disabled={isLeavingSelf}
          className={clsx(
            "shrink-0 w-5 h-5 flex items-center justify-center rounded-sm",
            "text-slate-300 hover:text-slate-600 hover:bg-slate-100/80",
            "border border-transparent hover:border-slate-200",
            "disabled:opacity-60 disabled:cursor-not-allowed",
          )}
          title="退出当前分工"
        >
          <UserMinus size={12} strokeWidth={2.5} />
        </button>
      )}

      {/* Left progress bar indicator (vertical left border effect instead of bottom) */}
      <div
        className={clsx("absolute top-0 bottom-0 left-0 w-0.75", cfg.bottomBar)}
      />
    </div>
  );
}
