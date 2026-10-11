import type { JSX, ReactNode } from "react";
import clsx from "clsx";

type Props = {
  label: string;
  disabled?: boolean | undefined;
  danger?: boolean | undefined;
  onClick: () => void;
  children: ReactNode;
};

export function AssignmentActionButton({
  label,
  disabled = false,
  danger = false,
  onClick,
  children,
}: Props): JSX.Element {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      onKeyDown={(event) => {
        event.stopPropagation();
      }}
      className={clsx(
        "flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border",
        "border-transparent transition-colors",
        danger
          ? "text-text-rose hover:border-line-rose-200 hover:bg-surface-rose-50 hover:text-text-rose"
          : [
              "text-text-muted-warm hover:border-line-stone-200",
              "hover:bg-surface-stone-100 hover:text-ink-stone-600",
            ],
        "focus-visible:outline-2 focus-visible:outline-primary/60",
        "disabled:cursor-not-allowed disabled:opacity-45",
      )}
    >
      {children}
    </button>
  );
}
