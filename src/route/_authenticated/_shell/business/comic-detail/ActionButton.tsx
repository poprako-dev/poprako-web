import type { JSX } from "react";
import clsx from "clsx";

type Props = {
  icon: React.ElementType;
  title: string;
  onClick: () => void;
  disabled?: boolean | undefined;
  danger?: boolean | undefined;
};

export function ActionButton({ icon: Icon, title, onClick, disabled, danger }: Props): JSX.Element {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "h-7 w-full rounded-sm flex items-center justify-center gap-1.5 px-2",
        "transition-all duration-200 active:scale-95",
        "shrink-0 relative",
        "after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2",
        "after:h-[2px] after:w-[60%] after:transition-all after:duration-200",
        "hover:after:w-[80%]",
        !danger && [
          "bg-surface-workspace text-muted-foreground",
          "hover:text-foreground",
          "after:bg-border",
        ],
        danger && [
          "bg-surface-workspace text-destructive/70",
          "hover:text-destructive",
          "after:bg-destructive/70",
        ],
        "disabled:opacity-50 disabled:cursor-not-allowed",
      )}
    >
      <Icon size={13} strokeWidth={2.5} />
      <span className="text-[10px] font-semibold">{title}</span>
    </button>
  );
}
