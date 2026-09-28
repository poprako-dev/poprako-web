import type { JSX } from "react";
import clsx from "clsx";
import { AppDialog, AppDialogAction } from "@/shared/component/AppDialog";
import type { WorkflowTransition } from "@/routes/_authenticated/business/chapter/chapter-input";
import type { WorkflowStatus } from "@/routes/_authenticated/business/chapter/workflow";

type Props = {
  label: string;
  status: WorkflowStatus;
  forwardTransition: WorkflowTransition | null;
  revertTransition: WorkflowTransition | null;
  onConfirm: (transition: WorkflowTransition) => void;
  onCancel: () => void;
};

const ROLE_LABEL_MAP: Record<string, string> = {
  图: "图源",
  翻: "翻译",
  校: "校对",
  嵌: "嵌字",
  监: "监修",
  传: "发布",
};

const PHASE_LABELS: Record<WorkflowStatus, string> = {
  pending: "未开始",
  ongoing: "进行中",
  completed: "已完成",
  unset: "未开始",
};

const STATUS_LABELS: Record<WorkflowStatus, string> = {
  pending: "未开始",
  ongoing: "进行中",
  completed: "已完成",
  unset: "—",
};

const STATUS_COLOR: Record<WorkflowStatus, string> = {
  pending: "text-slate-400",
  ongoing: "text-orange-400",
  completed: "text-emerald-400",
  unset: "text-slate-300",
};

const PHASE_ORDER: WorkflowStatus[] = ["pending", "ongoing", "completed"];

function transitionTarget(t: WorkflowTransition): WorkflowStatus {
  switch (t) {
    case "upload_complete":
    case "translate_complete":
    case "proofread_complete":
    case "typeset_complete":
    case "review_complete":
    case "publish_complete": {
      return "completed";
    }
    case "translate_start":
    case "proofread_start":
    case "typeset_start": {
      return "ongoing";
    }
    case "upload_revert":
    case "translate_start_revert":
    case "proofread_start_revert":
    case "typeset_start_revert":
    case "review_revert": {
      return "pending";
    }
    case "translate_revert":
    case "proofread_revert":
    case "typeset_revert": {
      return "ongoing";
    }
    default: {
      return "pending";
    }
  }
}

export function TransitionDialog({
  label,
  status,
  forwardTransition,
  revertTransition,
  onConfirm,
  onCancel,
}: Props): JSX.Element {
  const roleName = ROLE_LABEL_MAP[label] ?? label;
  const forwardTarget = forwardTransition ? transitionTarget(forwardTransition) : null;
  const revertTarget = revertTransition ? transitionTarget(revertTransition) : null;

  return (
    <AppDialog
      title={`${roleName}流程`}
      tone="warning"
      size="default"
      showClose={false}
      closeOnEscape={false}
      onClose={onCancel}
      footer={
        <div className="flex items-center gap-2">
          <AppDialogAction onClick={onCancel}>取消</AppDialogAction>
          {revertTransition && (
            <AppDialogAction
              tone="warning"
              onClick={() => {
                onConfirm(revertTransition);
              }}
            >
              回退
            </AppDialogAction>
          )}
          {forwardTransition && (
            <AppDialogAction
              tone="brand"
              onClick={() => {
                onConfirm(forwardTransition);
              }}
            >
              推进
            </AppDialogAction>
          )}
        </div>
      }
    >
      <p className={clsx("text-center text-sm font-semibold", STATUS_COLOR[status])}>
        当前：{STATUS_LABELS[status]}
      </p>

      <div className="mt-4 flex items-center justify-center gap-3">
        {PHASE_ORDER.map((phase, index) => {
          const isCurrent = phase === status;
          const isRevertTarget = phase === revertTarget;
          const isForwardTarget = phase === forwardTarget;

          return (
            <span key={phase} className="flex items-center gap-3">
              <span
                className={clsx(
                  "inline-block rounded-md px-2 py-0.5 text-xs transition-colors",
                  isCurrent && "border border-slate-200 bg-slate-50 text-slate-600",
                  !isCurrent && !isRevertTarget && !isForwardTarget && "text-slate-300/70",
                  isRevertTarget && !isCurrent && "bg-amber-50 text-amber-600",
                  isForwardTarget && !isCurrent && "bg-green-50 text-green-600",
                )}
              >
                {PHASE_LABELS[phase]}
              </span>

              {index < PHASE_ORDER.length - 1 && <span className="text-xs text-slate-200">→</span>}
            </span>
          );
        })}
      </div>
    </AppDialog>
  );
}
