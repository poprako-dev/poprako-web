import type { JSX, PointerEventHandler } from "react";
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
  onPointerDown?: PointerEventHandler<HTMLButtonElement> | undefined;
  onPointerMove?: PointerEventHandler<HTMLButtonElement> | undefined;
  onPointerUp?: PointerEventHandler<HTMLButtonElement> | undefined;
  onPointerCancel?: PointerEventHandler<HTMLButtonElement> | undefined;
  onLostPointerCapture?: PointerEventHandler<HTMLButtonElement> | undefined;
};
export function IssueMarker({
  appearance,
  id,
  number,
  rect,
  scale,
  isSelected,
  onSelect,
  ...pointerEvents
}: Props): JSX.Element {
  return (
    <button
      {...pointerEvents}
      data-canvas-annotation={id}
      type="button"
      onMouseDown={(event) => {
        event.stopPropagation();
      }}
      onTouchStart={(event) => {
        event.stopPropagation();
      }}
      aria-label={`定位标注 ${String(number)}`}
      title={`定位标注 ${String(number)}`}
      aria-pressed={isSelected}
      onClick={() => {
        onSelect(id);
      }}
      className={clsx(
        "absolute touch-none cursor-pointer rounded-sm border-2 border-solid bg-transparent outline-offset-2",
        isSelected ? "z-20" : "z-10",
      )}
      style={{
        ...previewPosition({ ...rect, width: rect.width * scale, height: rect.height * scale }),
        transformOrigin: "top left",
        transform: `scale(${String(1 / scale)})`,
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
          top: -2 - (MARKER_SIZE + 4),
          width: MARKER_SIZE,
          height: MARKER_SIZE,
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
