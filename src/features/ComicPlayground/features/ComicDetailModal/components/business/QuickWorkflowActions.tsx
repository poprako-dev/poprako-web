import { useRef, useState } from "react";
import clsx from "clsx";
import type { WorkflowTransition } from "@/features/ComicPlayground/types/chapter";
import { canApplyWorkflowTransition } from "@/types/chapter";
import type { ChapterInfo } from "@/types";
import type { AssignmentInfo } from "@/types/assignment";
import type { Result } from "@/types/utils/result";
import {
  ASSIGNMENT_ROLE_DEFS,
  type AssignmentRoleDef,
} from "./assignmentWorkflow";
import TransitionDialog from "./TransitionDialog";

type Props = {
  selectedChapter?: ChapterInfo;
  assignments: AssignmentInfo[];
  currentUserId?: string | null;
  onTransiteWorkflow: (transition: WorkflowTransition) => Promise<Result<void>>;
};

type QuickAction = {
  roleDef: AssignmentRoleDef;
  transition: WorkflowTransition;
  direction: "forward" | "revert";
};

function findQuickAction(
  roleDefs: AssignmentRoleDef[],
  chapter: ChapterInfo | undefined,
  assignments: AssignmentInfo[],
  currentUserId: string | null | undefined,
  direction: "forward" | "revert",
): QuickAction | null {
  if (!chapter || !currentUserId) return null;

  for (const roleDef of roleDefs) {
    const isAssigned = assignments.some(
      (assignment) =>
        assignment.userId === currentUserId && roleDef.matches(assignment),
    );
    if (!isAssigned) continue;

    const transition =
      direction === "forward"
        ? roleDef.nextTransition(roleDef.getStatus(chapter))
        : roleDef.prevRevertTransition(chapter);
    if (transition && canApplyWorkflowTransition(chapter, transition)) {
      return { roleDef, transition, direction };
    }
  }

  return null;
}

export default function QuickWorkflowActions({
  selectedChapter,
  assignments,
  currentUserId,
  onTransiteWorkflow,
}: Props) {
  const [pendingAction, setPendingAction] = useState<QuickAction | null>(null);
  const transitioningRef = useRef(false);
  const forwardAction = findQuickAction(
    ASSIGNMENT_ROLE_DEFS,
    selectedChapter,
    assignments,
    currentUserId,
    "forward",
  );
  const revertAction = findQuickAction(
    [...ASSIGNMENT_ROLE_DEFS].reverse(),
    selectedChapter,
    assignments,
    currentUserId,
    "revert",
  );

  const handleConfirm = async (transition: WorkflowTransition) => {
    if (transitioningRef.current) return;
    transitioningRef.current = true;
    setPendingAction(null);
    try {
      await onTransiteWorkflow(transition);
    } catch (error) {
      console.error("[QuickWorkflowActions] 流程操作失败:", error);
    } finally {
      transitioningRef.current = false;
    }
  };

  return (
    <div className="mt-2 grid grid-cols-2 gap-2 border-t border-stone-200 pt-3">
      <button
        type="button"
        disabled={!revertAction}
        onClick={() => revertAction && setPendingAction(revertAction)}
        className={clsx(
          "flex min-w-0 items-center justify-center gap-1.5 rounded-sm px-2 py-2",
          "text-xs font-semibold transition-colors",
          "bg-amber-50 text-amber-700 hover:bg-amber-100",
          "disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-300",
        )}
        title={
          revertAction
            ? `回退${revertAction.roleDef.fullLabel}`
            : "暂无可回退阶段"
        }
      >
        <span className="truncate">
          {revertAction
            ? `回退 · ${revertAction.roleDef.fullLabel}`
            : "不可回退"}
        </span>
      </button>
      <button
        type="button"
        disabled={!forwardAction}
        onClick={() => forwardAction && setPendingAction(forwardAction)}
        className={clsx(
          "flex min-w-0 items-center justify-center gap-1.5 rounded-sm px-2 py-2",
          "text-xs font-semibold transition-colors",
          "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
          "disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-300",
        )}
        title={
          forwardAction
            ? `推进${forwardAction.roleDef.fullLabel}`
            : "暂无可推进阶段"
        }
      >
        <span className="truncate">
          {forwardAction
            ? `推进 · ${forwardAction.roleDef.fullLabel}`
            : "不可推进"}
        </span>
      </button>

      {pendingAction && selectedChapter && (
        <TransitionDialog
          label={pendingAction.roleDef.shortLabel}
          status={pendingAction.roleDef.getStatus(selectedChapter)}
          forwardTransition={
            pendingAction.direction === "forward"
              ? pendingAction.transition
              : null
          }
          revertTransition={
            pendingAction.direction === "revert"
              ? pendingAction.transition
              : null
          }
          onConfirm={handleConfirm}
          onCancel={() => setPendingAction(null)}
        />
      )}
    </div>
  );
}
