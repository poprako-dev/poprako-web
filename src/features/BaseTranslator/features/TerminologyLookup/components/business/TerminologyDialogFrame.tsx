import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import clsx from "clsx";

type Props = {
  title: string;
  children: ReactNode;
  footer: ReactNode;
  locked: boolean;
  onClose: () => void;
};

export default function TerminologyDialogFrame({
  title,
  children,
  footer,
  locked,
  onClose,
}: Props) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !locked) onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [locked, onClose]);

  return createPortal(
    <div
      data-terminology-dialog
      role="presentation"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget && !locked) onClose();
      }}
      className={clsx(
        "fixed inset-0 z-[100] flex items-center justify-center p-4",
        "bg-stone-950/15 backdrop-blur-[2px]",
        "animate-in fade-in-0 duration-150",
      )}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={clsx(
          "flex max-h-[min(32rem,calc(100dvh-2rem))] w-full max-w-sm flex-col",
          "overflow-hidden rounded-sm border border-black/5 bg-white",
          "shadow-xl shadow-black/10",
          "animate-in fade-in-0 zoom-in-95 duration-150",
        )}
      >
        <header className="flex shrink-0 items-center gap-3 border-b border-stone-200 px-4 py-3">
          <h2 className="min-w-0 flex-1 text-sm font-semibold text-stone-800">
            {title}
          </h2>
          <button
            type="button"
            aria-label="关闭"
            disabled={locked}
            onClick={onClose}
            className={clsx(
              "flex size-6 shrink-0 items-center justify-center rounded-sm",
              "text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700",
              "disabled:cursor-not-allowed disabled:opacity-40",
            )}
          >
            <X size={14} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {children}
        </div>
        <footer className="shrink-0 border-t border-stone-200 px-4 py-3">
          {footer}
        </footer>
      </section>
    </div>,
    document.body,
  );
}
