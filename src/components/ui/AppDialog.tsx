import type { ComponentProps, ReactNode } from "react";
import { X } from "lucide-react";
import { Dialog } from "radix-ui";
import clsx from "clsx";
import { isKeyboardComposing } from "@/lib/keyboard";

type Size = "compact" | "default" | "large" | "wide";
type Tone = "brand" | "warning";

interface Props {
  title: string;
  description?: string | undefined;
  children: ReactNode;
  footer?: ReactNode | undefined;
  onClose: () => void;
  size?: Size | undefined;
  tone?: Tone | undefined;
  locked?: boolean | undefined;
  showClose?: boolean | undefined;
  closeOnEscape?: boolean | undefined;
  closeOnBackdrop?: boolean | undefined;
  bodyClassName?: string | undefined;
  contentClassName?: string | undefined;
}

export default function AppDialog({
  title,
  description,
  children,
  footer,
  onClose,
  size = "default",
  tone = "brand",
  locked = false,
  showClose = true,
  closeOnEscape = true,
  closeOnBackdrop = true,
  bodyClassName,
  contentClassName,
}: Props) {
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open && !locked) {onClose();}
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay
          data-app-dialog
          className={clsx(
            "fixed inset-0 z-100 bg-white/60 backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
            "duration-200 motion-reduce:animate-none",
          )}
        />
        <Dialog.Content
          data-app-dialog
          onKeyDown={(event) => { event.stopPropagation(); }}
          onKeyUp={(event) => { event.stopPropagation(); }}
          onEscapeKeyDown={(event) => {
            if (locked || !closeOnEscape || isKeyboardComposing(event)) {
              event.preventDefault();
            }
          }}
          onPointerDownOutside={(event) => {
            if (locked || !closeOnBackdrop) {event.preventDefault();}
          }}
          className={clsx(
            "fixed left-1/2 top-1/2 z-100 flex w-[calc(100%-2rem)]",
            "max-h-[calc(100dvh-2rem)] -translate-x-1/2 -translate-y-1/2",
            "flex-col overflow-hidden rounded-xl bg-white",
            "border border-(--color-border-green-200) shadow-(--shadow-sm)",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0",
            "data-[state=open]:zoom-in-95 duration-200 motion-reduce:animate-none",
            size === "compact" && "max-w-70",
            size === "default" && "max-w-sm",
            size === "large" && "max-w-xl",
            size === "wide" && "max-w-3xl",
            contentClassName,
          )}
        >
          <div
            className="h-1 w-full shrink-0 opacity-20"
            style={{
              background: tone === "warning"
                ? "var(--color-yellow-500)"
                : "var(--color-green-500)",
            }}
          />
          <div className="relative shrink-0 px-5 pb-2 pt-4 text-center">
            <Dialog.Title className="text-base font-bold text-slate-800">
              {title}
            </Dialog.Title>
            {description && (
              <Dialog.Description
                className="mt-1 text-xs leading-relaxed text-slate-400"
              >
                {description}
              </Dialog.Description>
            )}
            {!description && (
              <Dialog.Description className="sr-only">
                {title}对话框
              </Dialog.Description>
            )}
            {showClose && (
              <button
                type="button"
                aria-label="关闭"
                disabled={locked}
                onClick={onClose}
                className={clsx(
                  "absolute right-4 top-3.5 flex size-7 items-center justify-center",
                  "rounded-md text-slate-300 transition-colors",
                  "hover:bg-slate-50 hover:text-slate-500",
                  "disabled:cursor-not-allowed disabled:opacity-40",
                )}
              >
                <X size={15} />
              </button>
            )}
          </div>
          <div className={clsx("min-h-0 flex-1 overflow-y-auto px-5 py-3", bodyClassName)}>
            {children}
          </div>
          {footer !== null && footer !== undefined && (
            <div className="shrink-0 px-5 pb-5 pt-2">
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

type ActionProps = ComponentProps<"button"> & {
  tone?: "neutral" | "brand" | "danger" | "warning" | undefined;
};

export function AppDialogAction({
  tone = "neutral",
  className,
  ...props
}: ActionProps) {
  return (
    <button
      type="button"
      {...props}
      className={clsx(
        "flex h-8 items-center justify-center gap-1 rounded-lg border px-3",
        "text-xs font-semibold transition-all duration-200 active:scale-[0.98]",
        "flex-1 disabled:cursor-not-allowed disabled:opacity-50",
        tone === "neutral" && [
          "border-slate-100 bg-slate-50 text-slate-400",
          "hover:bg-slate-100 hover:text-slate-500",
        ],
        tone === "brand" && [
          "border-(--color-border-green-200) bg-green-50 text-green-600",
          "hover:bg-green-100",
        ],
        tone === "danger" && [
          "border-(--color-border-red-200) bg-red-50 text-red-500",
          "hover:bg-red-100",
        ],
        tone === "warning" && [
          "border-amber-100 bg-amber-50 text-amber-600",
          "hover:bg-amber-100",
        ],
        className,
      )}
    />
  );
}
