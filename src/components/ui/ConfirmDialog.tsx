import { useEffect } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import LoadingCircle from "@/components/ui/LoadingCircle";

type Props = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
};

export default function ConfirmDialog({
  title,
  description,
  confirmLabel = "确认",
  cancelLabel = "取消",
  onConfirm,
  onCancel,
  loading = false,
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
        "bg-white/60 backdrop-blur-sm",
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className={clsx(
          "w-full max-w-70 rounded-xl overflow-hidden",
          "bg-white",
          "border border-(--color-border-green-200)",
          "shadow-(--shadow-sm)",
        )}
      >
        {/* 顶部品牌色条 */}
        <div
          className="h-2 w-full opacity-20"
          style={{ background: "var(--color-yellow-500)" }}
        />

        <div className="px-5 pt-4 pb-2 text-center">
          <h3 className="text-base font-bold text-slate-800">{title}</h3>
          <p className="mt-1 text-sm text-slate-500 leading-relaxed">
            {description}
          </p>
        </div>

        <div className="flex items-center gap-2 px-5 pb-5 pt-3">
          <button
            onClick={onCancel}
            className={clsx(
              "flex-1 py-2 text-xs font-semibold rounded-lg",
              "transition-all duration-200 active:scale-[0.98]",
              "text-slate-400 bg-slate-50 hover:bg-slate-100",
              "border border-slate-100",
            )}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={clsx(
              "flex-1 py-2 text-xs font-semibold rounded-lg",
              "flex items-center justify-center gap-1",
              "transition-all duration-200 active:scale-[0.98]",
              "bg-red-50 text-red-500",
              "border border-(--color-border-red-200)",
              "hover:bg-red-100",
              loading && "opacity-60 cursor-not-allowed",
            )}
          >
            {loading ? <LoadingCircle /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
