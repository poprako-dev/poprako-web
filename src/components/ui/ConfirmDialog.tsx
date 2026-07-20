import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import clsx from "clsx";
import LoadingCircle from "@/components/ui/LoadingCircle";

type Props = {
  title: string;
  description?: string;
  children?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel: () => void;
  loading?: boolean;
  confirmDisabled?: boolean;
  confirmTone?: "danger" | "success";
  hideFooter?: boolean;
};

export default function ConfirmDialog({
  title,
  description,
  children,
  confirmLabel = "确认",
  cancelLabel = "取消",
  onConfirm,
  onCancel,
  loading = false,
  confirmDisabled = false,
  confirmTone = "danger",
  hideFooter = false,
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
      {/* stopPropagation: 防止点击事件沿 React 组件树冒泡到父级 onClick */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={clsx(
          "relative w-full max-w-70 rounded-xl overflow-hidden",
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

        {/* 标题行：标题居中，X 按钮右侧对齐 */}
        <div className="relative flex items-center px-5 pt-4">
          <h3 className="flex-1 text-center text-base font-bold text-slate-800">
            {title}
          </h3>
          <button
            onClick={onCancel}
            className={clsx(
              "absolute right-5",
              "inline-flex h-6 w-6 items-center justify-center rounded-sm",
              "text-slate-300 hover:text-slate-500",
              "hover:bg-slate-100 transition-colors",
              "active:scale-95",
            )}
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>

        {description && (
          <p className="px-5 pt-1 pb-2 text-center text-sm text-slate-500 leading-relaxed">
            {description}
          </p>
        )}

        {children}

        {!hideFooter && (
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
              disabled={loading || confirmDisabled}
              className={clsx(
                "flex-1 py-2 text-xs font-semibold rounded-lg",
                "flex items-center justify-center gap-1",
                "transition-all duration-200 active:scale-[0.98]",
                "border",
                confirmTone === "success"
                  ? "border-green-200 bg-green-50 text-green-600 hover:bg-green-100"
                  : "border-(--color-border-red-200) bg-red-50 text-red-500 hover:bg-red-100",
                (loading || confirmDisabled) && "opacity-60 cursor-not-allowed",
              )}
            >
              {loading ? <LoadingCircle /> : confirmLabel}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
