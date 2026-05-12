import {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
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

const PAN_THRESHOLD = 8;
const MARKER_DRAG_THRESHOLD = 3;
const MAX_SCALE = 2;
const ZOOM_STEP = 0.08;

type Transform = {
  scale: number;
  offsetX: number;
  offsetY: number;
};

type DragState = {
  type: "pan" | "marker";
  startX: number;
  startY: number;
  startOffsetX: number;
  startOffsetY: number;
  unitId?: string;
  startUnitX?: number;
  startUnitY?: number;
  exceeded: boolean;
};

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
  }: Props,
  ref: React.Ref<CanvasHandle>,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [transform, setTransform] = useState<Transform>({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  });
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const [dragMarker, setDragMarker] = useState<{
    id: string;
    x: number;
    y: number;
  } | null>(null);
  const [isPanning, setIsPanning] = useState(false);

  const dragRef = useRef<DragState | null>(null);
  const dragMarkerRef = useRef<{
    id: string;
    x: number;
    y: number;
  } | null>(null);
  const windowHandlersRef = useRef<{
    mouseMove: (e: MouseEvent) => void;
    mouseUp: (e: MouseEvent) => void;
    touchMove: (e: TouchEvent) => void;
    touchEnd: (e: TouchEvent) => void;
  } | null>(null);

  // Reset transform when image source changes
  useEffect(() => {
    setTransform({ scale: 1, offsetX: 0, offsetY: 0 });
  }, [imageSrc]);

  // Track container size via ResizeObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setContainerSize({ w: width, h: height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Cleanup window event listeners on unmount
  useEffect(() => {
    return () => {
      if (windowHandlersRef.current) {
        window.removeEventListener(
          "mousemove",
          windowHandlersRef.current.mouseMove,
        );
        window.removeEventListener(
          "mouseup",
          windowHandlersRef.current.mouseUp,
        );
        window.removeEventListener(
          "touchmove",
          windowHandlersRef.current.touchMove,
        );
        window.removeEventListener(
          "touchend",
          windowHandlersRef.current.touchEnd,
        );
      }
    };
  }, []);

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

  function tryAddUnit(clientX: number, clientY: number, isBubble: boolean) {
    if (!isUnitCreationEnabled) return;

    const img = imgRef.current;
    if (!img) return;

    const rect = img.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;

    if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
      onAddUnit?.(x, y, isBubble);
    }
  }

  function startDrag(
    type: "pan" | "marker",
    startX: number,
    startY: number,
    unitId?: string,
    startUnitX?: number,
    startUnitY?: number,
  ) {
    dragRef.current = {
      type,
      startX,
      startY,
      startOffsetX: transform.offsetX,
      startOffsetY: transform.offsetY,
      unitId,
      startUnitX,
      startUnitY,
      exceeded: false,
    };

    const threshold = type === "pan" ? PAN_THRESHOLD : MARKER_DRAG_THRESHOLD;

    const handleMoveAt = (clientX: number, clientY: number) => {
      const drag = dragRef.current;
      if (!drag) return;

      const dx = clientX - drag.startX;
      const dy = clientY - drag.startY;

      if (!drag.exceeded) {
        if (Math.sqrt(dx * dx + dy * dy) > threshold) {
          drag.exceeded = true;
          if (drag.type === "pan") setIsPanning(true);
        } else {
          return;
        }
      }

      if (drag.type === "pan") {
        setTransform((prev) => ({
          ...prev,
          offsetX: drag.startOffsetX + dx,
          offsetY: drag.startOffsetY + dy,
        }));
      } else {
        const img = imgRef.current;
        if (!img) return;
        const rect = img.getBoundingClientRect();
        const startUnitX = drag.startUnitX ?? 0;
        const startUnitY = drag.startUnitY ?? 0;
        const deltaX = dx / rect.width;
        const deltaY = dy / rect.height;
        const nextMarker = {
          id: drag.unitId!,
          x: Math.max(0, Math.min(1, startUnitX + deltaX)),
          y: Math.max(0, Math.min(1, startUnitY + deltaY)),
        };

        dragMarkerRef.current = nextMarker;
        setDragMarker(nextMarker);
      }
    };

    const handleEndAt = (clientX: number, clientY: number) => {
      const drag = dragRef.current;
      dragRef.current = null;
      setIsPanning(false);

      cleanup();

      if (!drag) return;

      if (!drag.exceeded) {
        if (drag.type === "pan") {
          tryAddUnit(clientX, clientY, true);
        } else {
          onFocusUnit?.(drag.unitId!);
        }
      } else if (drag.type === "marker") {
        const preview = dragMarkerRef.current;
        const nextX =
          preview && preview.id === drag.unitId ? preview.x : drag.startUnitX;
        const nextY =
          preview && preview.id === drag.unitId ? preview.y : drag.startUnitY;

        if (nextX !== undefined && nextY !== undefined) {
          onMoveUnit?.(drag.unitId!, nextX, nextY);
        }

        dragMarkerRef.current = null;
        setDragMarker(null);
      }
    };

    const cleanup = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      windowHandlersRef.current = null;
    };

    const handleMouseMove = (e: MouseEvent) =>
      handleMoveAt(e.clientX, e.clientY);
    const handleMouseUp = (e: MouseEvent) => handleEndAt(e.clientX, e.clientY);
    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch) handleMoveAt(touch.clientX, touch.clientY);
    };
    const handleTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      if (touch) handleEndAt(touch.clientX, touch.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);
    windowHandlersRef.current = {
      mouseMove: handleMouseMove,
      mouseUp: handleMouseUp,
      touchMove: handleTouchMove,
      touchEnd: handleTouchEnd,
    };
  }

  function handleCanvasMouseDown(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest("[data-marker]")) return;
    if (e.button !== 0) return;

    // Only pan when mouse starts over the image
    const img = imgRef.current;
    if (!img) return;
    const rect = img.getBoundingClientRect();
    if (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    )
      return;

    e.preventDefault();
    startDrag("pan", e.clientX, e.clientY);
  }

  function handleCanvasTouchStart(e: React.TouchEvent) {
    if ((e.target as HTMLElement).closest("[data-marker]")) return;
    const touch = e.touches[0];
    if (!touch) return;

    const img = imgRef.current;
    if (!img) return;
    const rect = img.getBoundingClientRect();
    if (
      touch.clientX < rect.left ||
      touch.clientX > rect.right ||
      touch.clientY < rect.top ||
      touch.clientY > rect.bottom
    )
      return;

    e.preventDefault();
    startDrag("pan", touch.clientX, touch.clientY);
  }

  function handleMarkerMouseDown(
    e: React.MouseEvent,
    unitId: string,
    xCoord: number,
    yCoord: number,
  ) {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    startDrag("marker", e.clientX, e.clientY, unitId, xCoord, yCoord);
  }

  function handleMarkerTouchStart(
    e: React.TouchEvent,
    unitId: string,
    xCoord: number,
    yCoord: number,
  ) {
    e.preventDefault();
    e.stopPropagation();
    const touch = e.touches[0];
    if (!touch) return;
    startDrag("marker", touch.clientX, touch.clientY, unitId, xCoord, yCoord);
  }

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault();

    // Right-click on marker → delete
    const markerEl = (e.target as HTMLElement).closest("[data-marker]");
    if (markerEl) {
      const unitId = markerEl.getAttribute("data-marker")!;
      onDeleteUnit?.(unitId);
      return;
    }

    // Right-click on empty image → add non-bubble unit
    tryAddUnit(e.clientX, e.clientY, false);
  }

  function handleWheel(e: React.WheelEvent) {
    const img = imgRef.current;
    const container = containerRef.current;
    if (!img || !container) return;

    // Only zoom when mouse is directly over the image
    const imgRect = img.getBoundingClientRect();
    if (
      e.clientX < imgRect.left ||
      e.clientX > imgRect.right ||
      e.clientY < imgRect.top ||
      e.clientY > imgRect.bottom
    )
      return;

    e.preventDefault();

    const direction = e.deltaY < 0 ? 1 : -1;
    const factor = 1 + ZOOM_STEP * direction;

    setTransform((prev) => {
      const newScale = Math.max(0.1, Math.min(MAX_SCALE, prev.scale * factor));
      if (newScale === prev.scale) return prev;

      const actualFactor = newScale / prev.scale;
      const containerRect = container.getBoundingClientRect();
      const centerX = containerRect.left + containerRect.width / 2;
      const centerY = containerRect.top + containerRect.height / 2;
      const mouseRelX = e.clientX - centerX - prev.offsetX;
      const mouseRelY = e.clientY - centerY - prev.offsetY;

      return {
        scale: newScale,
        offsetX: prev.offsetX - mouseRelX * (actualFactor - 1),
        offsetY: prev.offsetY - mouseRelY * (actualFactor - 1),
      };
    });
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden bg-muted touch-none select-none ${
        isPanning ? "cursor-grabbing" : "cursor-default"
      }`}
      onMouseDown={handleCanvasMouseDown}
      onTouchStart={handleCanvasTouchStart}
      onContextMenu={handleContextMenu}
      onWheel={handleWheel}
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
                    transform: `translate(-${CIRCLE_SIZE / 2 / transform.scale}px, -${PIN_OFFSET / transform.scale}px) scale(${1 / transform.scale})`,
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
                    withPreview={mode === "proofread"}
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
