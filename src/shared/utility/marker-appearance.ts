import clsx from "clsx";
export function markerSurfaceClass(
  isBubble: boolean,
  dimmed: boolean,
  isSelected: boolean,
): string {
  return clsx(
    "border-2 shadow-lg",
    isBubble
      ? dimmed
        ? "bg-surface-pink-300/40 border-line-pink-400/40"
        : "bg-surface-pink-300/80 border-line-pink-400/70"
      : dimmed
        ? "bg-surface-amber-300/40 border-line-amber-400/40"
        : "bg-surface-amber-300/80 border-line-amber-400/70",
    isSelected && "ring-4 ring-focus-blue-500/10",
  );
}
export const MARKER_TRANSITION = "background-color 0.2s, border-color 0.2s, box-shadow 0.2s";
export const MARKER_NUMBER_CLASS =
  "text-[13px] font-black text-ink-white tabular-nums leading-none";

export const MARKER_SIZE = 32;
