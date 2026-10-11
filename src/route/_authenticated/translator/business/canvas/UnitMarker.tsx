import type { JSX } from "react/jsx-runtime";
import clsx from "clsx";
import {
  markerSurfaceClass,
  MARKER_TRANSITION,
  MARKER_NUMBER_CLASS,
  MARKER_SIZE,
} from "@/shared/utility/marker-appearance";

export const CIRCLE_SIZE = MARKER_SIZE;
export const DOT_SIZE = 8;
export const PIN_OFFSET = CIRCLE_SIZE + DOT_SIZE - 2;

type Props = {
  index: number;
  isBubble: boolean;
  isCompleted: boolean;
  isSelected: boolean;
  isDragging: boolean;
  dimmed: boolean;
};

export function UnitMarker({
  index,
  isBubble,
  isCompleted,
  isSelected,
  isDragging,
  dimmed,
}: Props): JSX.Element {
  return (
    <div
      className={`flex flex-col items-center select-none ${
        isSelected ? "z-30" : "z-10"
      } ${isDragging ? "cursor-grabbing opacity-80" : "cursor-pointer"}`}
      style={{
        width: `${String(CIRCLE_SIZE)}px`,
        transform: isDragging ? "scale(1.1)" : undefined,
        transition: isDragging ? "none" : "transform 0.15s ease-out, opacity 0.15s ease-out",
      }}
    >
      <div
        className={clsx(
          "relative rounded-full flex items-center justify-center",
          markerSurfaceClass(isBubble, dimmed, isSelected),
        )}
        style={{
          width: `${String(CIRCLE_SIZE)}px`,
          height: `${String(CIRCLE_SIZE)}px`,
          borderColor: isSelected
            ? "var(--marker-selected)"
            : isCompleted
              ? "var(--brand-leaf)"
              : undefined,
          transition: MARKER_TRANSITION,
        }}
      >
        <span className={MARKER_NUMBER_CLASS}>{index + 1}</span>
      </div>
      <div
        className={clsx(
          "rounded-full -mt-px shadow-sm border-2 border-line-black/20",
          isBubble
            ? dimmed
              ? "bg-surface-pink-300/40"
              : "bg-surface-pink-300/80"
            : dimmed
              ? "bg-surface-amber-300/40"
              : "bg-surface-amber-300/80",
        )}
        style={{ width: `${String(DOT_SIZE)}px`, height: `${String(DOT_SIZE)}px` }}
      />
    </div>
  );
}
