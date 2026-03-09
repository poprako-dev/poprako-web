import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Check, Info, AlertCircle } from "lucide-react";
import clsx from "clsx";
import type { ToastType } from "./types";
import { useToastStore } from "./hooks";

const TOAST_DURATION = 3000;
const EXIT_DURATION = 300;

const borderColorMap: Record<ToastType, string> = {
  info: "border-blue-500",
  error: "border-red-500",
  success: "border-green-500",
};

const iconColorMap: Record<ToastType, string> = {
  info: "text-blue-600",
  error: "text-red-600",
  success: "text-green-600",
};

const iconMap: Record<ToastType, React.ReactNode> = {
  info: <Info size={16} />,
  error: <AlertCircle size={16} />,
  success: <Check size={16} />,
};

export default function NotificationToast() {
  const { toast, hideToast } = useToastStore();
  const [isLeaving, setIsLeaving] = useState(false);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      hideToast();
      setIsLeaving(false);
    }, EXIT_DURATION);
  };

  useEffect(() => {
    if (!toast) return;
    setIsLeaving(false);
    const timer = setTimeout(handleClose, TOAST_DURATION);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;

  return createPortal(
    <div
      className={clsx(
        "fixed top-8 left-1/2 -translate-x-1/2",
        "z-9999 transition-all",
        isLeaving
          ? clsx(
              "opacity-0 -translate-y-8",
              "duration-300 ease-in",
              "pointer-events-none",
            )
          : clsx(
              "opacity-100 translate-y-0",
              "duration-700",
              "ease-[cubic-bezier(0.23,1,0.32,1)]",
              "animate-in fade-in zoom-in-95",
            ),
      )}
    >
      <div
        className={clsx(
          "bg-white border-2 rounded-lg",
          "shadow-xl px-3 py-2",
          "flex items-center gap-1",
          "w-fit max-w-[90vw] whitespace-nowrap",
          borderColorMap[toast.type],
        )}
      >
        <div className={clsx("shrink-0 mr-2", iconColorMap[toast.type])}>
          {iconMap[toast.type]}
        </div>

        <span
          className={clsx(
            "font-semibold text-sm",
            "tracking-tight text-slate-700",
          )}
        >
          {toast.message}
        </span>

        <button
          onClick={handleClose}
          className={clsx(
            "ml-2 p-1 rounded-md shrink-0",
            "text-slate-400 hover:text-slate-600",
            "hover:bg-slate-100 transition-colors",
          )}
        >
          <X size={14} />
        </button>
      </div>
    </div>,
    document.body,
  );
}
