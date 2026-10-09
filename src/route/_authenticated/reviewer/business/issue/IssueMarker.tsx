import type { JSX } from "react";
import clsx from "clsx";
import {
  MARKER_TRANSITION,
  MARKER_NUMBER_CLASS,
  MARKER_SIZE,
} from "@/shared/utility/marker-appearance";
import type { issueAppearance } from "./issue-appearance";
import { previewPosition } from "@/shared/utility/page-geometry";
import type { PageRect } from "@/shared/utility/page-geometry";
type Props = {
  appearance: ReturnType<typeof issueAppearance>;
  id: string;
  number: number;
  rect: PageRect;
  scale: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
};
export function IssueMarker({
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
      aria-label={`定位 issue ${String(number)}`}
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
