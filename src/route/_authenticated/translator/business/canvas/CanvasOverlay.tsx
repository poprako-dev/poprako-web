import { memo, type ReactElement } from "react";
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
} from "@/route/_authenticated/translator/business/canvas/UnitMarker";
import { CanvasUnitMarker } from "./CanvasUnitMarker";
import { useCommittedCallback } from "@/shared/hook/use-committed-callback";
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

export function CanvasOverlay({ hoveredUnitId, ...props }: Props): ReactElement {
  const onFocusUnit = useCommittedCallback(props.onFocusUnit);
  const onMoveStart = useCommittedCallback(props.onMoveStart);
  const onTouchStart = useCommittedCallback(props.onTouchStart);
  const onToggleBubble = useCommittedCallback(props.onToggleBubble);
  const onHover = useCommittedCallback(props.onHover);
  const onUnhover = useCommittedCallback(props.onUnhover);
  return (
    <>
      <UnitMarkerLayer
        {...props}
        onFocusUnit={onFocusUnit}
        onMoveStart={onMoveStart}
        onTouchStart={onTouchStart}
        onToggleBubble={onToggleBubble}
        onHover={onHover}
        onUnhover={onUnhover}
      />
      <ProofreadPreview {...props} hoveredUnitId={hoveredUnitId} />
    </>
  );
}

function UnitMarkerLayerView(props: Omit<Props, "hoveredUnitId">): ReactElement {
  return (
    <>
      {props.units.map((unit) => {
        const id = unitId(unit);
        if (!id) return null;
        const position = unitPosition(unit);
        const dragMarker = props.dragMarker?.id === id ? props.dragMarker : null;
        return (
          <CanvasUnitMarker
            key={id}
            id={id}
            index={unitIndex(unit)}
            x={dragMarker?.x ?? position.xCoord}
            y={dragMarker?.y ?? position.yCoord}
            sourceX={position.xCoord}
            sourceY={position.yCoord}
            scale={props.scale}
            isBubble={unitIsBubble(unit)}
            isCompleted={
              props.mode === "translate" ? unitIsTranslated(unit) : unitIsProofread(unit)
            }
            isSelected={props.focusedUnitId === id}
            isDragging={dragMarker !== null}
            dimmed={props.proofreadPreviewVisibility === "dimmed"}
            enableReadOnly={props.enableReadOnly}
            onFocusUnit={props.onFocusUnit}
            onMoveStart={props.onMoveStart}
            onTouchStart={props.onTouchStart}
            onToggleBubble={props.onToggleBubble}
            onHover={props.onHover}
            onUnhover={props.onUnhover}
          />
        );
      })}
    </>
  );
}

const UnitMarkerLayer = memo(UnitMarkerLayerView);

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
