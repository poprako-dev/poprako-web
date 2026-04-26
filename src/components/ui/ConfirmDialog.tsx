import { useEffect } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";

type Props = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  title,
  description,
  confirmLabel = "确认",
  cancelLabel = "取消",
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  return createPortal(
    <div
      className={clsx(
        "fixed inset-0 z-[9999] flex items-center justify-center",
        "bg-black/15 backdrop-blur-[1px]",
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className={clsx(
          "bg-white rounded-sm border border-slate-200",
          "shadow-md shadow-slate-200/80",
          "px-5 py-4 w-72 flex flex-col gap-4",
        )}
      >
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold text-slate-600">{title}</h3>
          <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className={clsx(
              "px-3 py-1.5 text-xs font-medium rounded-xs",
              "text-slate-400 hover:text-slate-600",
              "border border-slate-200 hover:border-slate-300",
              "bg-white hover:bg-slate-50",
              "transition-colors",
            )}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={clsx(
              "px-3 py-1.5 text-xs font-medium rounded-xs",
              "text-slate-600 hover:text-slate-800",
              "border border-slate-300 hover:border-slate-400",
              "bg-slate-50 hover:bg-slate-100",
              "transition-colors",
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
