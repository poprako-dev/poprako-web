import clsx from "clsx";

export const floatingActionCellClass = clsx(
  "flex h-8 w-9 shrink-0 items-center justify-center",
  "text-ink-gray-600 transition-colors",
  "hover:bg-surface-stone-400/40 hover:text-ink-gray-900 hover:shadow-inner",
  "active:bg-surface-stone-400/60",
  "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent",
);
