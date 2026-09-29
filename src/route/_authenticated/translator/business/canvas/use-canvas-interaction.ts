import type { RefObject } from "react";
import type { Dispatch } from "react";
import type { SetStateAction } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { type Transform, useCanvasViewport } from "./use-canvas-viewport.ts";

const PAN_THRESHOLD = 8;
const MARKER_DRAG_THRESHOLD = 3;
type DragState = {
  type: "pan" | "marker";
  startX: number;
  startY: number;
  startOffsetX: number;
  startOffsetY: number;
  unitId?: string | undefined;
  startUnitX?: number | undefined;
  startUnitY?: number | undefined;
  exceeded: boolean;
};

type Args = {
  imageSrc: string | null;
  isUnitCreationEnabled: boolean;
  enableReadOnly: boolean;
  onFocusUnit: (unitId: string) => void;
  onMoveUnit: (unitId: string, xCoord: number, yCoord: number) => void;
  onAddUnit: (xCoord: number, yCoord: number, isBubble: boolean) => void;
  onDeleteUnit: (unitId: string) => void;
};

export function useCanvasInteraction({
  imageSrc,
  isUnitCreationEnabled,
  enableReadOnly,
  onFocusUnit,
  onMoveUnit,
  onAddUnit,
  onDeleteUnit,
}: Args): {
  containerRef: RefObject<HTMLDivElement | null>;
  imgRef: RefObject<HTMLImageElement | null>;
  transform: Transform;
  setTransform: Dispatch<SetStateAction<Transform>>;
  containerSize: { w: number; h: number };
  dragMarker: { id: string; x: number; y: number } | null;
  isPanning: boolean;
  handleCanvasMouseDown: (e: React.MouseEvent) => void;
  handleMarkerMouseDown: (
    e: React.MouseEvent,
    unitId: string,
    xCoord: number,
    yCoord: number,
  ) => void;
  handleMarkerTouchStart: (
    e: React.TouchEvent,
    unitId: string,
    xCoord: number,
    yCoord: number,
  ) => void;
  handleContextMenu: (e: React.MouseEvent) => void;
  handleWheel: (e: WheelEvent) => void;
} {
  const { containerRef, imgRef, transform, setTransform, containerSize, handleWheel } =
    useCanvasViewport({ imageSrc });
  const [dragMarker, setDragMarker] = useState<{ id: string; x: number; y: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);

  const dragRef = useRef<DragState | null>(null);
  const dragMarkerRef = useRef<{ id: string; x: number; y: number } | null>(null);
  const windowHandlersRef = useRef<{
    mouseMove: (e: MouseEvent) => void;
    mouseUp: (e: MouseEvent) => void;
    touchMove: (e: TouchEvent) => void;
    touchEnd: (e: TouchEvent) => void;
  } | null>(null);

  const tryAddUnit = useCallback(
    (clientX: number, clientY: number, isBubble: boolean) => {
      if (!isUnitCreationEnabled) return;

      const img = imgRef.current;
      if (!img) return;

      const rect = img.getBoundingClientRect();
      const x = (clientX - rect.left) / rect.width;
      const y = (clientY - rect.top) / rect.height;

      if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
        onAddUnit(x, y, isBubble);
      }
    },
    [imgRef, isUnitCreationEnabled, onAddUnit],
  );

  const startDrag = useCallback(
    (
      type: "pan" | "marker",
      startX: number,
      startY: number,
      unitId?: string,
      startUnitX?: number,
      startUnitY?: number,
    ) => {
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

      const handleMoveAt = (clientX: number, clientY: number): void => {
        const drag = dragRef.current;
        if (!drag) return;

        const dx = clientX - drag.startX;
        const dy = clientY - drag.startY;

        if (!drag.exceeded) {
          if (Math.hypot(dx, dy) > threshold) {
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
          return;
        }

        const img = imgRef.current;
        if (!img) return;

        const rect = img.getBoundingClientRect();
        const nextMarker = {
          id: drag.unitId ?? "",
          x: Math.max(0, Math.min(1, (drag.startUnitX ?? 0) + dx / rect.width)),
          y: Math.max(0, Math.min(1, (drag.startUnitY ?? 0) + dy / rect.height)),
        };

        dragMarkerRef.current = nextMarker;
        setDragMarker(nextMarker);
      };

      const cleanup = (): void => {
        removeEventListener("mousemove", handleMouseMove);
        removeEventListener("mouseup", handleMouseUp);
        removeEventListener("touchmove", handleTouchMove);
        removeEventListener("touchend", handleTouchEnd);
        windowHandlersRef.current = null;
      };

      const handleEndAt = (clientX: number, clientY: number): void => {
        const drag = dragRef.current;
        dragRef.current = null;
        setIsPanning(false);
        cleanup();

        if (!drag) return;

        if (!drag.exceeded) {
          if (drag.type === "pan") {
            tryAddUnit(clientX, clientY, true);
          } else {
            if (drag.unitId) onFocusUnit(drag.unitId);
          }
          return;
        }

        if (drag.type !== "marker") return;

        const preview = dragMarkerRef.current;
        const nextX = preview && preview.id === drag.unitId ? preview.x : drag.startUnitX;
        const nextY = preview && preview.id === drag.unitId ? preview.y : drag.startUnitY;

        if (nextX !== undefined && nextY !== undefined && drag.unitId) {
          onMoveUnit(drag.unitId, nextX, nextY);
        }

        dragMarkerRef.current = null;
        setDragMarker(null);
      };

      const handleMouseMove = (e: MouseEvent): void => {
        handleMoveAt(e.clientX, e.clientY);
      };
      const handleMouseUp = (e: MouseEvent): void => {
        handleEndAt(e.clientX, e.clientY);
      };
      const handleTouchMove = (e: TouchEvent): void => {
        const touch = e.touches[0];
        if (touch) handleMoveAt(touch.clientX, touch.clientY);
      };
      const handleTouchEnd = (e: TouchEvent): void => {
        const touch = e.changedTouches[0];
        if (touch) handleEndAt(touch.clientX, touch.clientY);
      };

      addEventListener("mousemove", handleMouseMove);
      addEventListener("mouseup", handleMouseUp);
      addEventListener("touchmove", handleTouchMove, { passive: true });
      addEventListener("touchend", handleTouchEnd);
      windowHandlersRef.current = {
        mouseMove: handleMouseMove,
        mouseUp: handleMouseUp,
        touchMove: handleTouchMove,
        touchEnd: handleTouchEnd,
      };
    },
    [
      imgRef,
      onFocusUnit,
      onMoveUnit,
      setTransform,
      transform.offsetX,
      transform.offsetY,
      tryAddUnit,
    ],
  );

  const handleCanvasTouchStart = useCallback(
    (e: TouchEvent) => {
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
      ) {
        return;
      }

      e.preventDefault();
      startDrag("pan", touch.clientX, touch.clientY);
    },
    [imgRef, startDrag],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("touchstart", handleCanvasTouchStart, {
      passive: false,
    });
    return () => {
      el.removeEventListener("touchstart", handleCanvasTouchStart);
    };
  }, [containerRef, handleCanvasTouchStart]);

  useEffect(() => {
    return () => {
      if (!windowHandlersRef.current) {
        return;
      }

      removeEventListener("mousemove", windowHandlersRef.current.mouseMove);
      removeEventListener("mouseup", windowHandlersRef.current.mouseUp);
      removeEventListener("touchmove", windowHandlersRef.current.touchMove);
      removeEventListener("touchend", windowHandlersRef.current.touchEnd);
    };
  }, []);

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest("[data-marker]")) return;
      if (e.button !== 0) return;

      const img = imgRef.current;
      if (!img) return;
      const rect = img.getBoundingClientRect();
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        return;
      }

      e.preventDefault();
      startDrag("pan", e.clientX, e.clientY);
    },
    [imgRef, startDrag],
  );

  const handleMarkerMouseDown = useCallback(
    (e: React.MouseEvent, unitId: string, xCoord: number, yCoord: number) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      if (enableReadOnly) {
        onFocusUnit(unitId);
        return;
      }
      startDrag("marker", e.clientX, e.clientY, unitId, xCoord, yCoord);
    },
    [enableReadOnly, onFocusUnit, startDrag],
  );

  const handleMarkerTouchStart = useCallback(
    (e: React.TouchEvent, unitId: string, xCoord: number, yCoord: number) => {
      e.preventDefault();
      e.stopPropagation();
      if (enableReadOnly) {
        onFocusUnit(unitId);
        return;
      }
      const touch = e.touches[0];
      if (!touch) return;
      startDrag("marker", touch.clientX, touch.clientY, unitId, xCoord, yCoord);
    },
    [enableReadOnly, onFocusUnit, startDrag],
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (enableReadOnly) return;

      const markerEl = e.target instanceof HTMLElement ? e.target.closest("[data-marker]") : null;
      if (markerEl) {
        const markerId = markerEl instanceof HTMLElement ? markerEl.dataset["marker"] : undefined;
        if (markerId) onDeleteUnit(markerId);
        return;
      }

      tryAddUnit(e.clientX, e.clientY, false);
    },
    [enableReadOnly, onDeleteUnit, tryAddUnit],
  );

  return {
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
  };
}
