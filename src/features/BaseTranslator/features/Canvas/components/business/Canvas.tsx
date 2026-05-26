import { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import clsx from "clsx";
import type { UnitInfo } from "@/types/unit";
import type { TranslatorMode } from "@/types/translatorMode";
import {
  unitFinalText,
  unitId,
  unitIndex,
  unitIsBubble,
  unitIsProofread,
  unitIsTranslated,
  unitPosition,
} from "@/types/unit";
import Marker, { CIRCLE_SIZE, PIN_OFFSET } from "@/features/BaseTranslator/features/Marker";
import LoadingCircle from "@/components/ui/LoadingCircle";
import type { ProofreadPreviewVisibility } from "@/features/BaseTranslator/types/preview";
import { useCanvasInteraction } from "../../hook/useCanvasInteraction";

export type CanvasHandle = {
  centerOn: (xCoord: number, yCoord: number) => void;
};

type Props = {
  imageSrc: string | null;
  units: UnitInfo[];
  mode: TranslatorMode;
  isLoading?: boolean;
  isUnitCreationEnabled?: boolean;
  focusedUnitId?: string;
  onFocusUnit?: (unitId: string) => void;
  onMoveUnit?: (unitId: string, xCoord: number, yCoord: number) => void;
  onAddUnit?: (xCoord: number, yCoord: number, isBubble: boolean) => void;
  onDeleteUnit?: (unitId: string) => void;
  enableReadOnly?: boolean;
  proofreadPreviewVisibility?: ProofreadPreviewVisibility;
};

const Canvas = forwardRef<CanvasHandle, Props>(function Canvas(
  {
    imageSrc,
    units,
    mode,
    isLoading = false,
    isUnitCreationEnabled = true,
    focusedUnitId,
    onFocusUnit,
    onMoveUnit,
    onAddUnit,
    onDeleteUnit,
    enableReadOnly = false,
    proofreadPreviewVisibility = "visible",
  }: Props,
  ref: React.Ref<CanvasHandle>,
) {
  const {
    containerRef,
    imgRef,
    transform,
    setTransform,
    containerSize,
    dragMarker,
    isPanning,
    handleCanvasMouseDown,
    handleMarkerMouseDown,
    handleMarkerTouchStart,
    handleContextMenu,
    handleWheel,
  } = useCanvasInteraction({
    imageSrc,
    isUnitCreationEnabled,
    enableReadOnly,
    onFocusUnit,
    onMoveUnit,
    onAddUnit,
    onDeleteUnit,
  });

  // Keep a live ref to transform to avoid stale closures in imperative handle
  const transformRef = useRef(transform);
  useEffect(() => {
    transformRef.current = transform;
  }, [transform]);

  useImperativeHandle(
    ref,
    () => ({
      centerOn(xCoord: number, yCoord: number) {
        const img = imgRef.current;
        if (!img) return;
        const scale = transformRef.current.scale;
        const offsetX = -(xCoord - 0.5) * img.offsetWidth * scale;
        const offsetY = -(yCoord - 0.5) * img.offsetHeight * scale;
        setTransform((prev) => ({ ...prev, offsetX, offsetY }));
      },
    }),
    [],
  );

  // 用 ref-based listener 替代 React onWheel，因为需要 { passive: false } 来支持 preventDefault
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  return (
    <div
      ref={containerRef}
      className={clsx(
        "relative w-full h-full overflow-hidden bg-stone-100 touch-none select-none",
        isPanning ? "cursor-grabbing" : "cursor-default",
      )}
      onMouseDown={handleCanvasMouseDown}
      onContextMenu={handleContextMenu}
    >
      {isLoading ? (
        <div className="flex items-center justify-center w-full h-full">
          <LoadingCircle />
        </div>
      ) : imageSrc ? (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{
            transform: `translate(${transform.offsetX}px, ${transform.offsetY}px)`,
          }}
        >
          <div
            className="relative inline-block pointer-events-auto"
            style={{
              transform: `scale(${transform.scale})`,
              transformOrigin: "center center",
            }}
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt=""
              draggable={false}
              className="select-none shadow-md"
              style={{
                maxWidth: containerSize.w * 0.9,
                maxHeight: containerSize.h * 0.87,
                width: "auto",
                height: "auto",
              }}
            />

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
                  className="absolute pointer-events-auto"
                  style={{
                    left: `${x * 100}%`,
                    top: `${y * 100}%`,
                    transformOrigin: "0 0",
                    transform: `translate(-${CIRCLE_SIZE / 2 / transform.scale}px, `
                      + `-${PIN_OFFSET / transform.scale}px) `
                      + `scale(${1 / transform.scale})`,
                  }}
                  onMouseDown={(e) =>
                    handleMarkerMouseDown(
                      e,
                      id,
                      position.xCoord,
                      position.yCoord,
                    )
                  }
                  onTouchStart={(e) =>
                    handleMarkerTouchStart(
                      e,
                      id,
                      position.xCoord,
                      position.yCoord,
                    )
                  }
                >
                  <Marker
                    index={unitIndex(unit)}
                    isBubble={unitIsBubble(unit)}
                    isCompleted={
                      mode === "translate"
                        ? unitIsTranslated(unit)
                        : unitIsProofread(unit)
                    }
                    isSelected={focusedUnitId === id}
                    isDragging={isDraggingThis}
                    previewText={unitFinalText(unit)}
                    previewMode={
                      mode === "proofread" ? "visible" : "hidden"
                    }
                    dimmed={proofreadPreviewVisibility === "dimmed"}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center w-full h-full text-muted-foreground">
          暂无图片
        </div>
      )}
    </div>
  );
});

export default Canvas;
