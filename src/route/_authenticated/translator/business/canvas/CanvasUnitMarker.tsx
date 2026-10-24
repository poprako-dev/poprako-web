import { memo, type ReactElement } from "react";
import { CIRCLE_SIZE, PIN_OFFSET, UnitMarker } from "./UnitMarker";
import type { ReturnTypeUsePageInteraction } from "./canvas-overlay-types";

type Props = {
  id: string;
  index: number;
  x: number;
  y: number;
  sourceX: number;
  sourceY: number;
  scale: number;
  isBubble: boolean;
  isCompleted: boolean;
  isSelected: boolean;
  isDragging: boolean;
  dimmed: boolean;
  enableReadOnly: boolean;
  onFocusUnit: (unitId: string) => void;
  onMoveStart: ReturnTypeUsePageInteraction["handleMarkerMouseDown"];
  onTouchStart: ReturnTypeUsePageInteraction["handleMarkerTouchStart"];
  onToggleBubble: (unitId: string) => void;
  onHover: (unitId: string) => void;
  onUnhover: (unitId: string) => void;
};

function CanvasUnitMarkerView(props: Props): ReactElement {
  return (
    <div
      data-marker={props.id}
      role="button"
      tabIndex={0}
      aria-label={`第 ${String(props.index + 1)} 个翻校单元`}
      className="absolute pointer-events-auto"
      style={{
        left: `${String(props.x * 100)}%`,
        top: `${String(props.y * 100)}%`,
        transformOrigin: "0 0",
        transform:
          `translate(-${String(CIRCLE_SIZE / 2 / props.scale)}px, ` +
          `-${String(PIN_OFFSET / props.scale)}px) scale(${String(1 / props.scale)})`,
      }}
      onMouseDown={(event) => {
        props.onMoveStart(event, props.id, props.sourceX, props.sourceY);
      }}
      onTouchStart={(event) => {
        props.onTouchStart(event, props.id, props.sourceX, props.sourceY);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          props.onFocusUnit(props.id);
        }
      }}
      onDoubleClick={(event) => {
        event.stopPropagation();
        if (!props.enableReadOnly) props.onToggleBubble(props.id);
      }}
      onMouseEnter={() => {
        props.onHover(props.id);
      }}
      onMouseLeave={() => {
        props.onUnhover(props.id);
      }}
    >
      <UnitMarker
        index={props.index}
        isBubble={props.isBubble}
        isCompleted={props.isCompleted}
        isSelected={props.isSelected}
        isDragging={props.isDragging}
        dimmed={props.dimmed}
      />
    </div>
  );
}

export const CanvasUnitMarker = memo(CanvasUnitMarkerView);
