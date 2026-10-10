import type { ReactElement } from "react";
import clsx from "clsx";
import type { UnitInfo } from "@/route/_authenticated/translator/business/unit/unit";
import type { TranslatorMode } from "@/route/_authenticated/translator/business/unit/translator-mode";
import {
  unitFinalText,
  unitId,
  unitIndex,
  unitIsBubble,
  unitIsProofread,
  unitIsTranslated,
  unitPosition,
} from "@/route/_authenticated/translator/business/unit/unit";
import {
  CIRCLE_SIZE,
  PIN_OFFSET,
  UnitMarker,
} from "@/route/_authenticated/translator/business/canvas/UnitMarker";
import type { ReturnTypeUsePageInteraction } from "./canvas-overlay-types";
import type { ProofreadPreviewVisibility } from "../contract/preview";

type Props = {
  scale: number;
  units: UnitInfo[];
  mode: TranslatorMode;
  dragMarker: ReturnTypeUsePageInteraction["dragMarker"];
  focusedUnitId: string | undefined;
  enableReadOnly: boolean;
  proofreadPreviewVisibility: ProofreadPreviewVisibility;
  hoveredUnitId: string | null;
  onFocusUnit: (unitId: string) => void;
  onMoveStart: ReturnTypeUsePageInteraction["handleMarkerMouseDown"];
  onTouchStart: ReturnTypeUsePageInteraction["handleMarkerTouchStart"];
  onToggleBubble: (unitId: string) => void;
  onHover: (unitId: string) => void;
  onUnhover: (unitId: string) => void;
};

export function CanvasOverlay(props: Props): ReactElement {
  return (
    <>
      <UnitMarkerLayer {...props} />
      <ProofreadPreview {...props} />
    </>
  );
}

function UnitMarkerLayer(props: Props): ReactElement {
  return (
    <>
      {props.units.map((unit) => (
        <CanvasUnitMarker key={String(unitIndex(unit))} unit={unit} {...props} />
      ))}
    </>
  );
}

function CanvasUnitMarker({ unit, ...props }: Props & { unit: UnitInfo }): ReactElement | null {
  const id = unitId(unit);
  if (!id) return null;
  const position = unitPosition(unit);
  const isDragging = props.dragMarker?.id === id;
  const draggingMarker = isDragging ? props.dragMarker : null;
  const x = draggingMarker ? draggingMarker.x : position.xCoord;
  const y = draggingMarker ? draggingMarker.y : position.yCoord;

  return (
    <div
      data-marker={id}
      role="button"
      tabIndex={0}
      aria-label={`第 ${String(unitIndex(unit) + 1)} 个 Unit`}
      className="absolute pointer-events-auto"
      style={{
        left: `${String(x * 100)}%`,
        top: `${String(y * 100)}%`,
        transformOrigin: "0 0",
        transform:
          `translate(-${String(CIRCLE_SIZE / 2 / props.scale)}px, ` +
          `-${String(PIN_OFFSET / props.scale)}px) scale(${String(1 / props.scale)})`,
      }}
      onMouseDown={(event) => {
        props.onMoveStart(event, id, position.xCoord, position.yCoord);
      }}
      onTouchStart={(event) => {
        props.onTouchStart(event, id, position.xCoord, position.yCoord);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          props.onFocusUnit(id);
        }
      }}
      onDoubleClick={(event) => {
        event.stopPropagation();
        if (!props.enableReadOnly) props.onToggleBubble(id);
      }}
      onMouseEnter={() => {
        props.onHover(id);
      }}
      onMouseLeave={() => {
        props.onUnhover(id);
      }}
    >
      <UnitMarker
        index={unitIndex(unit)}
        isBubble={unitIsBubble(unit)}
        isCompleted={props.mode === "translate" ? unitIsTranslated(unit) : unitIsProofread(unit)}
        isSelected={props.focusedUnitId === id}
        isDragging={isDragging}
        dimmed={props.proofreadPreviewVisibility === "dimmed"}
      />
    </div>
  );
}

function ProofreadPreview(props: Props): ReactElement | null {
  const previewUnitId =
    props.hoveredUnitId ??
    (props.mode === "proofread" && props.proofreadPreviewVisibility === "visible"
      ? props.focusedUnitId
      : null);
  const unit = previewUnitId ? props.units.find((item) => unitId(item) === previewUnitId) : null;
  if (!unit || !unitFinalText(unit) || props.dragMarker?.id === previewUnitId) return null;

  const position = unitPosition(unit);
  return (
    <div
      className="absolute z-50 pointer-events-none"
      style={{
        left: `${String(position.xCoord * 100)}%`,
        top: `${String(position.yCoord * 100)}%`,
        transformOrigin: "0 0",
        transform:
          `translate(${String((CIRCLE_SIZE / 2 + 12) / props.scale)}px, ` +
          `${String((CIRCLE_SIZE - PIN_OFFSET) / props.scale)}px) ` +
          `scale(${String(1 / props.scale)})`,
      }}
    >
      <div
        className={clsx(
          "-translate-y-full",
          "px-2 py-1 rounded-sm bg-surface-slate-800/90 text-ink-slate-50 text-xs",
          "backdrop-blur-md shadow-xl border border-line-white/10 whitespace-pre",
        )}
      >
        {unitFinalText(unit)}
      </div>
    </div>
  );
}
