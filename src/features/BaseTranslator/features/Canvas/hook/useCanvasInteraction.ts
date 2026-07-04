import { useCallback, useEffect, useRef, useState } from "react";

const PAN_THRESHOLD = 8;
const MARKER_DRAG_THRESHOLD = 3;
const MIN_SCALE = 0.5;
const MAX_SCALE = 5;
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

type Args = {
  imageSrc: string | null;
  isUnitCreationEnabled: boolean;
  enableReadOnly: boolean;
  onFocusUnit?: (unitId: string) => void;
  onMoveUnit?: (unitId: string, xCoord: number, yCoord: number) => void;
  onAddUnit?: (xCoord: number, yCoord: number, isBubble: boolean) => void;
  onDeleteUnit?: (unitId: string) => void;
};

export function useCanvasInteraction({
  imageSrc,
  isUnitCreationEnabled,
  enableReadOnly,
  onFocusUnit,
  onMoveUnit,
  onAddUnit,
  onDeleteUnit,
}: Args) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [transform, setTransform] = useState<Transform>({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  });
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const [dragMarker, setDragMarker] = useState<{ id: string; x: number; y: number } | null>(
    null,
  );
  const [isPanning, setIsPanning] = useState(false);

  const dragRef = useRef<DragState | null>(null);
  const dragMarkerRef = useRef<{ id: string; x: number; y: number } | null>(null);
  const windowHandlersRef = useRef<{
    mouseMove: (e: MouseEvent) => void;
    mouseUp: (e: MouseEvent) => void;
    touchMove: (e: TouchEvent) => void;
    touchEnd: (e: TouchEvent) => void;
  } | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTransform({ scale: 1, offsetX: 0, offsetY: 0 });
  }, [imageSrc]);

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

  const tryAddUnit = useCallback(
    (clientX: number, clientY: number, isBubble: boolean) => {
      if (!isUnitCreationEnabled) return;

      const img = imgRef.current;
      if (!img) return;

      const rect = img.getBoundingClientRect();
      const x = (clientX - rect.left) / rect.width;
      const y = (clientY - rect.top) / rect.height;

      if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
        onAddUnit?.(x, y, isBubble);
      }
    },
    [isUnitCreationEnabled, onAddUnit],
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
          return;
        }

        const img = imgRef.current;
        if (!img) return;

        const rect = img.getBoundingClientRect();
        const nextMarker = {
          id: drag.unitId!,
          x: Math.max(0, Math.min(1, (drag.startUnitX ?? 0) + dx / rect.width)),
          y: Math.max(0, Math.min(1, (drag.startUnitY ?? 0) + dy / rect.height)),
        };

        dragMarkerRef.current = nextMarker;
        setDragMarker(nextMarker);
      };

      const cleanup = () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
        window.removeEventListener("touchmove", handleTouchMove);
        window.removeEventListener("touchend", handleTouchEnd);
        windowHandlersRef.current = null;
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
          return;
        }

        if (drag.type !== "marker") return;

        const preview = dragMarkerRef.current;
        const nextX = preview && preview.id === drag.unitId ? preview.x : drag.startUnitX;
        const nextY = preview && preview.id === drag.unitId ? preview.y : drag.startUnitY;

        if (nextX !== undefined && nextY !== undefined) {
          onMoveUnit?.(drag.unitId!, nextX, nextY);
        }

        dragMarkerRef.current = null;
        setDragMarker(null);
      };

      const handleMouseMove = (e: MouseEvent) => handleMoveAt(e.clientX, e.clientY);
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
    },
    [onFocusUnit, onMoveUnit, transform.offsetX, transform.offsetY, tryAddUnit],
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
    [startDrag],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("touchstart", handleCanvasTouchStart, { passive: false });
    return () => el.removeEventListener("touchstart", handleCanvasTouchStart);
  }, [handleCanvasTouchStart]);

  useEffect(() => {
    return () => {
      if (windowHandlersRef.current) {
        window.removeEventListener("mousemove", windowHandlersRef.current.mouseMove);
        window.removeEventListener("mouseup", windowHandlersRef.current.mouseUp);
        window.removeEventListener("touchmove", windowHandlersRef.current.touchMove);
        window.removeEventListener("touchend", windowHandlersRef.current.touchEnd);
      }
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
    [startDrag],
  );

  const handleMarkerMouseDown = useCallback(
    (e: React.MouseEvent, unitId: string, xCoord: number, yCoord: number) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      if (enableReadOnly) {
        onFocusUnit?.(unitId);
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
      const touch = e.touches[0];
      if (!touch) return;
      startDrag("marker", touch.clientX, touch.clientY, unitId, xCoord, yCoord);
    },
    [startDrag],
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (enableReadOnly) return;

      const markerEl = (e.target as HTMLElement).closest("[data-marker]");
      if (markerEl) {
        const unitId = markerEl.getAttribute("data-marker")!;
        onDeleteUnit?.(unitId);
        return;
      }

      tryAddUnit(e.clientX, e.clientY, false);
    },
    [enableReadOnly, onDeleteUnit, tryAddUnit],
  );

  const handleWheel = useCallback((e: WheelEvent) => {
    const img = imgRef.current;
    const container = containerRef.current;
    if (!img || !container) return;

    const imgRect = img.getBoundingClientRect();
    if (
      e.clientX < imgRect.left ||
      e.clientX > imgRect.right ||
      e.clientY < imgRect.top ||
      e.clientY > imgRect.bottom
    ) {
      return;
    }

    e.preventDefault();

    const direction = e.deltaY < 0 ? 1 : -1;
    const factor = 1 + ZOOM_STEP * direction;

    setTransform((prev) => {
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev.scale * factor));
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
  }, []);

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
