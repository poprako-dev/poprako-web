import { useState } from "react";
import type { ReactElement, Ref } from "react";
import type { UnitInfo } from "@/route/_authenticated/translator/business/unit/unit";
import type { TranslatorMode } from "@/route/_authenticated/translator/business/unit/translator-mode";
import { CanvasOverlay } from "@/route/_authenticated/translator/business/canvas/CanvasOverlay";
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
      overlay={(scale) => (
        <CanvasOverlay
          scale={scale}
          units={units}
          mode={mode}
          dragMarker={dragMarker}
          focusedUnitId={focusedUnitId}
          enableReadOnly={enableReadOnly}
          proofreadPreviewVisibility={proofreadPreviewVisibility}
          hoveredUnitId={hoveredUnitId}
          onFocusUnit={onFocusUnit}
          onMoveStart={handleMarkerMouseDown}
          onTouchStart={handleMarkerTouchStart}
          onToggleBubble={onToggleBubble}
          onHover={setHoveredUnitId}
          onUnhover={(id) => {
            setHoveredUnitId((previous) => (previous === id ? null : previous));
          }}
        />
      )}
    />
  );
}
