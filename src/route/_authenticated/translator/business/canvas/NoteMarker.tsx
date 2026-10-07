import type { JSX } from "react";
import clsx from "clsx";
import { MARKER_TRANSITION, MARKER_NUMBER_CLASS, MARKER_SIZE } from "./marker-appearance";
import type { revisionNoteAppearance } from "../revision-note/revision-note-appearance";
import { previewPosition } from "./page-geometry";
import type { PageRect } from "./page-geometry";
type Props = {
  appearance: ReturnType<typeof revisionNoteAppearance>;
  id: string;
  number: number;
  rect: PageRect;
  scale: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
};
export function NoteMarker({
  appearance,
  id,
  number,
  rect,
  scale,
  isSelected,
  onSelect,
}: Props): JSX.Element {
  return (
    <button
      data-canvas-annotation={id}
      type="button"
      onMouseDown={(event) => {
        event.stopPropagation();
      }}
      onTouchStart={(event) => {
        event.stopPropagation();
      }}
      aria-label={`定位 revision_note ${String(number)}`}
      aria-pressed={isSelected}
      onClick={() => {
        onSelect(id);
      }}
      className={clsx(
        "absolute cursor-pointer rounded-sm border-2 border-solid bg-transparent outline-offset-2 focus-visible:outline-2 focus-visible:outline-outline-stone-500",
        isSelected ? "z-20" : "z-10",
      )}
      style={{
        ...previewPosition(rect),
        borderColor: isSelected
          ? "var(--marker-selected)"
          : `color-mix(in srgb, ${appearance.border} 70%, transparent)`,
        transition: MARKER_TRANSITION,
      }}
    >
      <span
        className={clsx(
          "absolute flex items-center justify-center rounded-md select-none",
          "border-2 shadow-lg",
          isSelected && "ring-4 ring-focus-blue-500/10",
          MARKER_NUMBER_CLASS,
        )}
        style={{
          left: -2,
          top: -2 - (MARKER_SIZE + 4) / scale,
          width: MARKER_SIZE,
          height: MARKER_SIZE,
          transformOrigin: "top left",
          transform: `scale(${String(1 / scale)})`,
          borderColor: isSelected
            ? "var(--marker-selected)"
            : `color-mix(in srgb, ${appearance.border} 70%, transparent)`,
          backgroundColor: `color-mix(in srgb, ${appearance.color} 80%, transparent)`,
          transition: MARKER_TRANSITION,
        }}
      >
        {number}
      </span>
    </button>
  );
}
