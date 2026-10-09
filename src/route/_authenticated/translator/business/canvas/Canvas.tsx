import { useState } from "react";
import type { ReactElement, Ref } from "react";
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
  UnitMarker,
  PIN_OFFSET,
} from "@/route/_authenticated/translator/business/canvas/UnitMarker";
import { PageCanvas } from "@/shared/component/PageCanvas";
import type { CanvasHandle } from "@/shared/component/PageCanvas";
export type { CanvasHandle } from "@/shared/component/PageCanvas";
import { usePageInteraction } from "@/shared/hook/use-page-interaction";
import type { ProofreadPreviewVisibility } from "../contract/preview";
type Props = {
  imageSrc: string | null;
  units: UnitInfo[];
  mode: TranslatorMode;
  isLoading: boolean;
  isUnitCreationEnabled: boolean;
  focusedUnitId: string | undefined;
  onFocusUnit: (unitId: string) => void;
  onMoveUnit: (unitId: string, xCoord: number, yCoord: number) => void;
  onAddUnit: (xCoord: number, yCoord: number, isBubble: boolean) => void;
  onDeleteUnit: (unitId: string) => void;
  onToggleBubble: (unitId: string) => void;
  onImageLoad: () => void;
  enableReadOnly: boolean;
  proofreadPreviewVisibility: ProofreadPreviewVisibility;
  ref: Ref<CanvasHandle>;
};

export function Canvas({
  imageSrc,
  units,
  mode,
  isLoading,
  isUnitCreationEnabled,
  focusedUnitId,
  onFocusUnit,
  onMoveUnit,
  onAddUnit,
  onDeleteUnit,
  onToggleBubble,
  onImageLoad,
  enableReadOnly,
  proofreadPreviewVisibility,
  ref,
}: Props): ReactElement {
  const interaction = usePageInteraction({
    imageSrc,
    editing: {
      isMarkerCreationEnabled: isUnitCreationEnabled,
      enableReadOnly,
      onFocusMarker: onFocusUnit,
      onMoveMarker: onMoveUnit,
      onAddMarker: onAddUnit,
      onDeleteMarker: onDeleteUnit,
    },
  });
  const { dragMarker, handleMarkerMouseDown, handleMarkerTouchStart } = interaction;
  const [hoveredUnitId, setHoveredUnitId] = useState<string | null>(null);
  return (
    <PageCanvas
      ref={ref}
      interaction={interaction}
      imageSrc={imageSrc}
      isLoading={isLoading}
      onImageLoad={onImageLoad}
      overlay={(scale) => {
        const transform = { scale };
        return (
          <>
            {units.map((unit) => {
              const id = unitId(unit);

              if (!id) {
                return null;
              }

              const isDraggingThis = dragMarker?.id === id;
              const draggingMarker = isDraggingThis ? dragMarker : null;
              const position = unitPosition(unit);
              const x = draggingMarker ? draggingMarker.x : position.xCoord;
              const y = draggingMarker ? draggingMarker.y : position.yCoord;

              return (
                <div
                  key={id}
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
                      `translate(-${String(CIRCLE_SIZE / 2 / transform.scale)}px, ` +
                      `-${String(PIN_OFFSET / transform.scale)}px) ` +
                      `scale(${String(1 / transform.scale)})`,
                  }}
                  onMouseDown={(e) => {
                    handleMarkerMouseDown(e, id, position.xCoord, position.yCoord);
                  }}
                  onTouchStart={(e) => {
                    handleMarkerTouchStart(e, id, position.xCoord, position.yCoord);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onFocusUnit(id);
                    }
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    if (!enableReadOnly) onToggleBubble(id);
                  }}
                  onMouseEnter={() => {
                    setHoveredUnitId(id);
                  }}
                  onMouseLeave={() => {
                    setHoveredUnitId((prev) => (prev === id ? null : prev));
                  }}
                >
                  <UnitMarker
                    index={unitIndex(unit)}
                    isBubble={unitIsBubble(unit)}
                    isCompleted={
                      mode === "translate" ? unitIsTranslated(unit) : unitIsProofread(unit)
                    }
                    isSelected={focusedUnitId === id}
                    isDragging={isDraggingThis}
                    dimmed={proofreadPreviewVisibility === "dimmed"}
                  />
                </div>
              );
            })}

            {/* Preview overlay — rendered outside markers to avoid z-index stacking issues */}
            {(() => {
              // hover takes priority over focus; focus only shows in proofread mode
              const previewUnitId =
                hoveredUnitId ??
                (mode === "proofread" && proofreadPreviewVisibility === "visible"
                  ? focusedUnitId
                  : null);
              const previewUnit = previewUnitId
                ? units.find((u) => unitId(u) === previewUnitId)
                : null;
              if (!previewUnit || !unitFinalText(previewUnit) || dragMarker?.id === previewUnitId) {
                return null;
              }
              const pos = unitPosition(previewUnit);
              return (
                <div
                  className="absolute z-50 pointer-events-none"
                  style={{
                    left: `${String(pos.xCoord * 100)}%`,
                    top: `${String(pos.yCoord * 100)}%`,
                    transformOrigin: "0 0",
                    transform:
                      `translate(${String((CIRCLE_SIZE / 2 + 12) / transform.scale)}px, ` +
                      `${String((CIRCLE_SIZE - PIN_OFFSET) / transform.scale)}px) ` +
                      `scale(${String(1 / transform.scale)})`,
                  }}
                >
                  <div
                    className={clsx(
                      "-translate-y-full",
                      "px-2 py-1 rounded-sm bg-surface-slate-800/90 text-ink-slate-50 text-xs",
                      "backdrop-blur-md shadow-xl border border-line-white/10 whitespace-pre",
                    )}
                  >
                    {unitFinalText(previewUnit)}
                  </div>
                </div>
              );
            })()}
          </>
        );
      }}
    />
  );
}
