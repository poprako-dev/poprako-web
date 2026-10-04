import type { JSX } from "react/jsx-runtime";
import clsx from "clsx";

export const CIRCLE_SIZE = 32;
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

export function Marker({
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
      } ${isDragging ? "cursor-grabbing" : "cursor-pointer"}`}
      style={{
        width: `${String(CIRCLE_SIZE)}px`,
        transform: isDragging ? "scale(1.1)" : undefined,
        transition: isDragging ? "none" : "transform 0.15s ease-out, opacity 0.15s ease-out",
      }}
    >
      <div
        data-contrast-plate
        className={clsx(
          "relative rounded-full flex items-center justify-center",
          "border-2 shadow-lg",
          isBubble
            ? dimmed
              ? "bg-surface-pink-50 border-marker-bubble-border"
              : "bg-marker-bubble border-marker-bubble-border"
            : dimmed
              ? "bg-surface-amber-50 border-marker-note-border"
              : "bg-marker-note border-marker-note-border",
          isSelected && "ring-4 ring-focus-blue-500/10",
        )}
        style={{
          width: `${String(CIRCLE_SIZE)}px`,
          height: `${String(CIRCLE_SIZE)}px`,
          borderColor: isSelected
            ? "var(--marker-selected)"
            : isCompleted
              ? "var(--text-leaf)"
              : undefined,
          transition: "background-color 0.2s, border-color 0.2s, box-shadow 0.2s",
          boxShadow: "0 0 0 1px var(--surface-white), 0 0 0 3px var(--focus-indicator)",
        }}
      >
        <span className="text-[13px] font-black text-heading-forest tabular-nums leading-none">
          {index + 1}
        </span>
      </div>
      <div
        data-contrast-plate
        className={clsx(
          "rounded-full -mt-px shadow-sm border-2 border-focus-indicator",
          isBubble
            ? dimmed
              ? "bg-surface-pink-50"
              : "bg-marker-bubble"
            : dimmed
              ? "bg-surface-amber-50"
              : "bg-marker-note",
        )}
        style={{ width: `${String(DOT_SIZE)}px`, height: `${String(DOT_SIZE)}px` }}
      />
    </div>
  );
}
