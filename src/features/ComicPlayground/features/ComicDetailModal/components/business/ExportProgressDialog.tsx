import { useEffect } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import LoadingCircle from "@/components/ui/LoadingCircle";

type Props = {
  open: boolean;
  title: string;
  description: string;
  progress: number;
  onCancel: () => void;
};

export default function ExportProgressDialog({
  open,
  title,
  description,
  progress,
  onCancel,
}: Props) {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [onCancel, open]);

  if (!open) return null;

  return createPortal(
    <div
      className={clsx(
        "fixed inset-0 z-[10000] flex items-center justify-center",
        "bg-black/25 backdrop-blur-[2px]",
      )}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onMouseUp={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-progress-title"
        className={clsx(
          "w-[min(92vw,24rem)] rounded-sm border border-slate-200 bg-white px-5 py-4",
          "shadow-lg shadow-slate-300/40",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <LoadingCircle
            size={20}
            className="mt-0.5 inline-flex shrink-0 items-center justify-center text-slate-500 animate-spin"
            aria-label="exporting"
          />
          <div className="min-w-0 flex-1">
            <h3
              id="export-progress-title"
              className="text-sm font-semibold text-slate-700"
            >
              {title}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              {description}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-slate-500 transition-[width] duration-200"
              style={{ width: `${Math.max(0, Math.min(progress, 100))}%` }}
            />
          </div>
          <p className="mt-2 text-right text-xs tabular-nums text-slate-400">
            {Math.round(progress)}%
          </p>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={onCancel}
            className={clsx(
              "rounded-xs border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium",
              "text-slate-600 transition-colors hover:border-slate-400 hover:bg-slate-50",
            )}
          >
            取消下载
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
