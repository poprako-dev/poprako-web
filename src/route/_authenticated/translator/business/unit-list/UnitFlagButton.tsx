import type { JSX } from "react/jsx-runtime";
import { Star } from "lucide-react";
import clsx from "clsx";

type Props = {
  isFlagged: boolean;
  isDisabled: boolean;
  onToggle: () => void;
};

export function UnitFlagButton({ isFlagged, isDisabled, onToggle }: Props): JSX.Element {
  const label = isFlagged ? "取消标记" : "标记待回看";
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={isFlagged}
      disabled={isDisabled}
      onPointerDown={(event) => {
        if (event.pointerType === "mouse") event.preventDefault();
        event.stopPropagation();
      }}
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      className={clsx(
        "flex size-7 shrink-0 items-center justify-center rounded cursor-pointer",
        "transition-colors hover:bg-surface-stone-200/70 focus-visible:outline-outline-stone-500",
        "disabled:cursor-not-allowed disabled:opacity-50",
        isFlagged ? "text-[var(--status-flag)]" : "text-ink-stone-400",
      )}
    >
      <Star size={16} fill={isFlagged ? "currentColor" : "none"} aria-hidden="true" />
    </button>
  );
}
