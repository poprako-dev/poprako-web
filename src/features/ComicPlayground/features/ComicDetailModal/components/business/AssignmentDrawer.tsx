import { useState, useRef } from "react";
import clsx from "clsx";
import { Plus, UserPlus, UserMinus, Trash2 } from "lucide-react";
import type { WorkflowTransition } from "@/features/ComicPlayground/types/chapter";
import { canApplyWorkflowTransition } from "@/types/chapter";
import type { ChapterInfo } from "@/types";
import type { AssignmentInfo } from "@/types/assignment";
import type { WorkflowStatus } from "@/types/workflow";
import type { Result } from "@/types/utils/result";
import type { Role } from "@/types/role";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { ASSIGNMENT_ROLE_DEFS } from "./assignmentWorkflow";
import QuickWorkflowActions from "./QuickWorkflowActions";
import TransitionDialog from "./TransitionDialog";

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

type StatusConfig = {
  statusLabel: string;
  statusTextColor: string;
  borderColor: string;
  dotColor: string;
};

const STATUS_CONFIG: Record<WorkflowStatus, StatusConfig> = {
  pending: {
    statusLabel: "未开始",
    statusTextColor: "text-slate-400",
    borderColor: "border-slate-300",
    dotColor: "bg-slate-300",
  },
  ongoing: {
    statusLabel: "进行中",
    statusTextColor: "text-orange-400",
    borderColor: "border-orange-300",
    dotColor: "bg-orange-300",
  },
  completed: {
    statusLabel: "已完成",
    statusTextColor: "text-emerald-500",
    borderColor: "border-emerald-400",
    dotColor: "bg-emerald-400",
  },
  unset: {
    statusLabel: "未配置",
    statusTextColor: "text-slate-300",
    borderColor: "border-slate-200",
    dotColor: "bg-slate-200",
  },
};

export default function AssignmentDrawer({
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
  const [isOpen, setIsOpen] = useState(false);
  const [transitioningRole, setTransitioningRole] = useState<Role | null>(null);
  const [pendingRemove, setPendingRemove] = useState<{
    userId: string;
    name: string;
    role: Role;
  } | null>(null);
  const transitioningRef = useRef(false);

  const handleTransition = async (transition: WorkflowTransition) => {
    if (transitioningRef.current) return;
    transitioningRef.current = true;
    setTransitioningRole(null);
    try {
      await onTransiteWorkflow(transition);
    } catch (err) {
      console.error("[AssignmentDrawer] 流程操作失败:", err);
    } finally {
      transitioningRef.current = false;
    }
  };

  return (
    <div
      className={clsx(
        "hidden md:flex",
        "absolute right-0 top-0 bottom-0 z-20",
        "w-70",
        "transition-transform duration-300 ease-in-out",
        isOpen
          ? "translate-x-0 shadow-[-4px_0_12px_rgba(0,0,0,0.08)]"
          : "translate-x-64",
      )}
    >
      {/* Trigger strip */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        title={isOpen ? "收起分工面板" : "展开分工面板"}
        className={clsx(
          "w-6 h-full flex flex-col items-center justify-center gap-1",
          "bg-stone-50 border-l border-stone-200 shrink-0",
          "text-stone-400 hover:text-stone-600 hover:bg-stone-100",
          "transition-colors duration-200",
        )}
      >
        <div className="flex flex-col gap-1">
          {ASSIGNMENT_ROLE_DEFS.map((roleDef) => {
            const s = selectedChapter
              ? roleDef.getStatus(selectedChapter)
              : "unset";
            return (
              <div
                key={roleDef.shortLabel}
                className={clsx(
                  "w-1.5 h-1.5 rounded-full",
                  STATUS_CONFIG[s].dotColor,
                )}
              />
            );
          })}
        </div>
      </button>

      {/* Drawer panel */}
      <div
        className={clsx(
          "w-64 h-full bg-stone-50",
          "border-l border-stone-200",
          "overflow-y-auto",
          "scrollbar-thin scrollbar-thumb-stone-200",
        )}
      >
        <div className="px-3 py-3 flex flex-col gap-3">
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
            const cfg = STATUS_CONFIG[status];

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

            const hasAnyTransition =
              forwardTransition != null || revertTransition != null;
            const isShowingDialog = transitioningRole === roleDef.addRole;

            return (
              <div
                key={roleDef.addRole}
                className={clsx(
                  "rounded-r-sm border-l-2 py-1 pl-3 pr-1 transition-colors",
                  cfg.borderColor,
                  hasAnyTransition && "hover:bg-stone-200/70",
                )}
              >
                {/* Role header row */}
                <div
                  onClick={() => {
                    if (hasAnyTransition && !transitioningRef.current) {
                      setTransitioningRole(roleDef.addRole);
                    }
                  }}
                  className={clsx(
                    "flex items-center gap-2 mb-1",
                    hasAnyTransition && "cursor-pointer group",
                  )}
                >
                  <span
                    className={clsx(
                      "text-sm font-semibold text-stone-700",
                      hasAnyTransition &&
                        "group-hover:text-stone-900 transition-colors",
                    )}
                  >
                    {roleDef.fullLabel}
                  </span>

                  <div className="flex-1" />

                  {/* Add member button */}
                  {canManageAssignments && onAddAssignment && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddAssignment(roleDef.addRole);
                      }}
                      className={clsx(
                        "w-5 h-5 flex items-center justify-center rounded-sm",
                        "text-slate-300/70 hover:text-slate-700",
                        "hover:bg-slate-100/80",
                        "border border-transparent hover:border-slate-200",
                      )}
                      title="添加成员"
                    >
                      <Plus size={12} strokeWidth={2.5} />
                    </button>
                  )}

                  {/* Join role button */}
                  {canJoinRole?.(roleDef.addRole) && onJoinRole && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onJoinRole(roleDef.addRole);
                      }}
                      disabled={isRoleJoining?.(roleDef.addRole)}
                      className={clsx(
                        "w-5 h-5 flex items-center justify-center rounded-sm",
                        "text-slate-300/70 hover:text-slate-700",
                        "hover:bg-slate-100/80",
                        "border border-transparent hover:border-slate-200",
                        "disabled:opacity-60 disabled:cursor-not-allowed",
                      )}
                      title="加入当前分工"
                    >
                      <UserPlus size={12} strokeWidth={2.5} />
                    </button>
                  )}

                  {/* Leave role button */}
                  {!canJoinRole?.(roleDef.addRole) &&
                    canLeaveRole?.(roleDef.addRole) &&
                    onLeaveRole && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onLeaveRole(roleDef.addRole);
                        }}
                        disabled={isRoleLeaving?.(roleDef.addRole)}
                        className={clsx(
                          "w-5 h-5 flex items-center justify-center rounded-sm",
                          "text-rose-300/70 hover:text-rose-500",
                          "hover:bg-rose-50",
                          "border border-transparent hover:border-rose-200",
                          "disabled:opacity-60 disabled:cursor-not-allowed",
                        )}
                        title="离开当前分工"
                      >
                        <UserMinus size={12} strokeWidth={2.5} />
                      </button>
                    )}
                </div>

                {/* Members list */}
                <div className="flex flex-col gap-0.5">
                  {roleAssignments.length === 0 ? (
                    <span className="text-xs text-slate-300 italic">
                      未分配
                    </span>
                  ) : (
                    roleAssignments.map((a) => (
                      <div
                        key={a.userId}
                        className="flex items-start justify-between gap-1 group/member"
                      >
                        <span
                          className={clsx(
                            "text-xs text-stone-600 leading-5",
                            "break-all",
                          )}
                        >
                          {a.user?.name ?? a.userId}
                        </span>
                        {canManageAssignments && onRemoveAssignment && (
                          <button
                            onClick={() =>
                              setPendingRemove({
                                userId: a.userId,
                                name: a.user?.name ?? a.userId,
                                role: roleDef.addRole,
                              })
                            }
                            className={clsx(
                              "opacity-0 group-hover/member:opacity-100",
                              "transition-opacity mt-0.5 shrink-0",
                              "w-4 h-4 flex items-center justify-center",
                              "rounded-sm text-slate-300 hover:text-rose-400",
                            )}
                            title="移除成员"
                          >
                            <Trash2 size={11} strokeWidth={2} />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Transition dialog for this role */}
                {isShowingDialog && (
                  <TransitionDialog
                    label={roleDef.shortLabel}
                    status={status}
                    forwardTransition={forwardTransition}
                    revertTransition={revertTransition}
                    onConfirm={handleTransition}
                    onCancel={() => setTransitioningRole(null)}
                  />
                )}
              </div>
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

      {/* Remove member confirm dialog */}
      {pendingRemove && (
        <ConfirmDialog
          title="移除成员"
          description={`确认移除「${pendingRemove.name}」的分工？`}
          confirmLabel="移除"
          onConfirm={() => {
            onRemoveAssignment?.(pendingRemove.userId, pendingRemove.role);
            setPendingRemove(null);
          }}
          onCancel={() => setPendingRemove(null)}
        />
      )}
    </div>
  );
}
