import { createPortal } from "react-dom";
import clsx from "clsx";
import type { WorkflowTransition } from "@/features/ComicPlayground/types/chapter";
import type { WorkflowStatus } from "@/types/workflow";

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
    case "publish_complete":
      return "completed";
    case "translate_start":
    case "proofread_start":
    case "typeset_start":
      return "ongoing";
    case "upload_revert":
    case "translate_start_revert":
    case "proofread_start_revert":
    case "typeset_start_revert":
    case "review_revert":
      return "pending";
    case "translate_revert":
    case "proofread_revert":
    case "typeset_revert":
      return "ongoing";
    default:
      return "pending";
  }
}

export default function TransitionDialog({
  label,
  status,
  forwardTransition,
  revertTransition,
  onConfirm,
  onCancel,
}: Props) {
  const roleName = ROLE_LABEL_MAP[label] ?? label;
  const hasForward = forwardTransition != null;
  const hasRevert = revertTransition != null;

  const forwardTarget = forwardTransition
    ? transitionTarget(forwardTransition)
    : null;
  const revertTarget = revertTransition
    ? transitionTarget(revertTransition)
    : null;

  return createPortal(
    <div
      className={clsx(
        "fixed inset-0 z-[9999] flex items-center justify-center",
        "bg-white/60 backdrop-blur-sm",
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      {/* stopPropagation: 防止点击事件沿 React 组件树冒泡到父级 onClick，
          导致 dialog 刚被 onCancel 关闭又被父级立即重新打开 */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={clsx(
          "w-full max-w-xs rounded-sm overflow-hidden",
          "bg-white",
          "shadow-(--shadow-sm)",
        )}
      >
        <div
          className="h-1.5 w-full opacity-20"
          style={{ background: "var(--color-yellow-500)" }}
        />

        <div className="px-6 pt-5 pb-4">
          <h3 className="text-base font-bold text-slate-800 text-center">
            {roleName}流程
          </h3>

          <p
            className={clsx(
              "mt-2 font-semibold text-sm text-center",
              STATUS_COLOR[status],
            )}
          >
            当前：{STATUS_LABELS[status]}
          </p>

          {/* Phase flow */}
          <div className="mt-4 flex items-center justify-center gap-3">
            {PHASE_ORDER.map((phase, i) => {
              const isCurrent = phase === status;
              const isRevertTarget = phase === revertTarget;
              const isForwardTarget = phase === forwardTarget;

              return (
                <span key={phase} className="flex items-center gap-3">
                  <span
                    className={clsx(
                      "inline-block px-2 py-0.5 text-xs",
                      "transition-colors",
                      // current phase: border
                      isCurrent &&
                        "border-2 border-slate-300 rounded-sm text-slate-600",
                      // unstyled defaults
                      !isCurrent &&
                        !isRevertTarget &&
                        !isForwardTarget &&
                        "text-slate-300/70",
                      // revert target: amber underline
                      isRevertTarget &&
                        !isCurrent &&
                        "text-amber-500 underline decoration-amber-300 underline-offset-2",
                      // forward target: green underline
                      isForwardTarget &&
                        !isCurrent &&
                        "text-emerald-500 underline decoration-emerald-300 underline-offset-2",
                    )}
                  >
                    {PHASE_LABELS[phase]}
                  </span>

                  {i < PHASE_ORDER.length - 1 && (
                    <span className="text-slate-200 text-xs">→</span>
                  )}
                </span>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 px-6 pb-5">
          <button
            onClick={onCancel}
            className={clsx(
              "flex-1 py-2 text-xs font-semibold rounded-sm",
              "transition-all duration-200 active:scale-[0.98]",
              "text-slate-400 bg-slate-50 hover:bg-slate-100",
            )}
          >
            取消
          </button>

          {hasRevert && (
            <button
              onClick={() => revertTransition && onConfirm(revertTransition)}
              className={clsx(
                "flex-1 py-2 text-xs font-semibold rounded-sm",
                "transition-all duration-200 active:scale-[0.98]",
                "bg-amber-50 text-amber-600 hover:bg-amber-100",
              )}
            >
              回退
            </button>
          )}

          {hasForward && (
            <button
              onClick={() => forwardTransition && onConfirm(forwardTransition)}
              className={clsx(
                "flex-1 py-2 text-xs font-semibold rounded-sm",
                "transition-all duration-200 active:scale-[0.98]",
                "bg-emerald-50 text-emerald-600 hover:bg-emerald-100",
              )}
            >
              推进
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
