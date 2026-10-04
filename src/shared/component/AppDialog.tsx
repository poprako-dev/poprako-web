import type { ComponentProps, ReactElement, ReactNode } from "react";
import { X } from "lucide-react";
import { Dialog } from "radix-ui";
import clsx from "clsx";
import { isKeyboardComposing } from "@/shared/utility/keyboard";

type Size = "compact" | "default" | "large" | "wide";
type Tone = "brand" | "warning";

type Props = {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  size?: Size;
  tone?: Tone;
  locked?: boolean;
  showClose?: boolean;
  closeOnEscape?: boolean;
  closeOnBackdrop?: boolean;
  bodyClassName?: string;
  contentClassName?: string;
};

export function AppDialog({
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
}: Props): ReactElement {
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open && !locked) {
          onClose();
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay
          data-app-dialog
          className={clsx(
            "fixed inset-0 z-100 bg-surface-white/60 backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
            "duration-200 motion-reduce:animate-none",
          )}
        />
        <Dialog.Content
          data-app-dialog
          onKeyDown={(event) => {
            event.stopPropagation();
          }}
          onKeyUp={(event) => {
            event.stopPropagation();
          }}
          onEscapeKeyDown={(event) => {
            if (locked || !closeOnEscape || isKeyboardComposing(event)) {
              event.preventDefault();
            }
          }}
          onPointerDownOutside={(event) => {
            if (locked || !closeOnBackdrop) {
              event.preventDefault();
            }
          }}
          className={clsx(
            "fixed left-1/2 top-1/2 z-100 flex w-[calc(100%-2rem)]",
            "max-h-[calc(100dvh-2rem)] -translate-x-1/2 -translate-y-1/2",
            "flex-col overflow-hidden rounded-xl bg-surface-white",
            "border border-(--brand-leaf-border) shadow-(--shadow-sm)",
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
            aria-hidden="true"
            className="h-1 w-full shrink-0 opacity-20"
            style={{
              background: tone === "warning" ? "var(--status-flag)" : "var(--brand-leaf)",
            }}
          />
          <div className="relative shrink-0 px-5 pb-2 pt-4 text-center">
            <Dialog.Title className="text-base font-bold text-ink-slate-800">{title}</Dialog.Title>
            {description && (
              <Dialog.Description className="mt-1 text-xs leading-relaxed text-text-muted-cool">
                {description}
              </Dialog.Description>
            )}
            {!description && (
              <Dialog.Description className="sr-only">{title}对话框</Dialog.Description>
            )}
            {showClose && (
              <button
                type="button"
                aria-label="关闭"
                disabled={locked}
                onClick={onClose}
                className={clsx(
                  "absolute right-4 top-3.5 flex size-7 items-center justify-center",
                  "rounded-md text-text-muted-cool transition-colors",
                  "hover:bg-surface-slate-50 hover:text-text-muted-cool",
                  "disabled:cursor-not-allowed disabled:opacity-40",
                )}
              >
                <X size={15} />
              </button>
            )}
          </div>
          <div
            role="region"
            aria-label={`${title}内容`}
            tabIndex={0}
            className={clsx("min-h-0 flex-1 overflow-y-auto px-5 py-3", bodyClassName)}
          >
            {children}
          </div>
          {footer !== null && footer !== undefined && (
            <div className="shrink-0 px-5 pb-5 pt-2">{footer}</div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

type ActionProps = ComponentProps<"button"> & {
  tone?: "neutral" | "brand" | "danger" | "warning";
};

export function AppDialogAction({
  tone = "neutral",
  className,
  ...props
}: ActionProps): ReactElement {
  return (
    <button
      type="button"
      {...props}
      className={clsx(
        "flex h-8 items-center justify-center gap-1 rounded-lg border px-3",
        "text-xs font-semibold transition-all duration-200 active:scale-[0.98]",
        "flex-1 disabled:cursor-not-allowed disabled:opacity-50",
        tone === "neutral" && [
          "border-line-slate-100 bg-surface-slate-50 text-ink-slate-600",
          "hover:bg-surface-slate-100 hover:text-ink-slate-700",
        ],
        tone === "brand" && [
          "border-(--brand-leaf-border) bg-surface-green-50 text-ink-green-800",
          "hover:bg-surface-green-100",
        ],
        tone === "danger" && [
          "border-(--danger-border) bg-surface-red-50 text-text-danger",
          "hover:bg-surface-red-100",
        ],
        tone === "warning" && [
          "border-line-amber-100 bg-surface-amber-50 text-ink-amber-600",
          "hover:bg-surface-amber-100",
        ],
        className,
      )}
    />
  );
}
