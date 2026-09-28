import { useRef, useState } from "react";
import type { ReactElement } from "react";
import clsx from "clsx";
import type { WorkflowTransition } from "@/route/_authenticated/business/chapter/chapter-input";
import { canApplyWorkflowTransition } from "@/route/_authenticated/business/chapter/chapter";
import type { ChapterInfo } from "@/route/_authenticated/business/chapter/chapter";
import type { AssignmentInfo } from "@/route/_authenticated/business/assignment/assignment";
import type { Result } from "@/shared/utility/result";
import {
  ASSIGNMENT_ROLE_DEFS,
  type AssignmentRoleDef,
} from "@/route/_authenticated/_shell/business/comic-detail/assignment-workflow";
import { TransitionDialog } from "@/route/_authenticated/_shell/business/comic-detail/TransitionDialog";

type Props = {
  selectedChapter?: ChapterInfo | undefined;
  assignments: AssignmentInfo[];
  currentUserId: string;
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
  currentUserId: string,
  direction: "forward" | "revert",
): QuickAction | null {
  if (!chapter || !currentUserId) return null;

  for (const roleDef of roleDefs) {
    const isAssigned = assignments.some(
      (assignment) => assignment.userId === currentUserId && roleDef.matches(assignment),
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

export function QuickWorkflowActions({
  selectedChapter,
  assignments,
  currentUserId,
  onTransiteWorkflow,
}: Props): ReactElement {
  const [pendingAction, setPendingAction] = useState<QuickAction | null>(null);
  const transitioningRef = useRef(false);
  const forwardAction = findQuickAction(
    ASSIGNMENT_ROLE_DEFS,
    selectedChapter,
    assignments,
    currentUserId,
    "forward",
  );
  const reversedRoleDefs = [...ASSIGNMENT_ROLE_DEFS].reverse();
  const revertAction = findQuickAction(
    reversedRoleDefs,
    selectedChapter,
    assignments,
    currentUserId,
    "revert",
  );

  const handleConfirm = async (transition: WorkflowTransition): Promise<void> => {
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
    <div className="mt-2 grid grid-cols-2 gap-2 border-t border-border pt-3">
      <button
        type="button"
        disabled={!revertAction}
        onClick={() => {
          if (revertAction) setPendingAction(revertAction);
        }}
        className={clsx(
          "flex min-w-0 items-center justify-center gap-1.5 rounded-sm px-2 py-2",
          "text-xs font-semibold transition-colors",
          "bg-status-warning/10 text-status-warning hover:bg-status-warning/10",
          "disabled:cursor-not-allowed disabled:bg-surface-hover disabled:text-muted-foreground",
        )}
        title={revertAction ? `回退${revertAction.roleDef.fullLabel}` : "暂无可回退阶段"}
      >
        <span className="truncate">
          {revertAction ? `回退 · ${revertAction.roleDef.fullLabel}` : "不可回退"}
        </span>
      </button>
      <button
        type="button"
        disabled={!forwardAction}
        onClick={() => {
          if (forwardAction) setPendingAction(forwardAction);
        }}
        className={clsx(
          "flex min-w-0 items-center justify-center gap-1.5 rounded-sm px-2 py-2",
          "text-xs font-semibold transition-colors",
          "bg-status-success/10 text-status-success hover:bg-status-success/10",
          "disabled:cursor-not-allowed disabled:bg-surface-hover disabled:text-muted-foreground",
        )}
        title={forwardAction ? `推进${forwardAction.roleDef.fullLabel}` : "暂无可推进阶段"}
      >
        <span className="truncate">
          {forwardAction ? `推进 · ${forwardAction.roleDef.fullLabel}` : "不可推进"}
        </span>
      </button>

      {pendingAction && selectedChapter && (
        <TransitionDialog
          label={pendingAction.roleDef.shortLabel}
          status={pendingAction.roleDef.getStatus(selectedChapter)}
          forwardTransition={
            pendingAction.direction === "forward" ? pendingAction.transition : null
          }
          revertTransition={pendingAction.direction === "revert" ? pendingAction.transition : null}
          onConfirm={(transition) => {
            void handleConfirm(transition);
          }}
          onCancel={() => {
            setPendingAction(null);
          }}
        />
      )}
    </div>
  );
}
