import type { Dispatch, RefObject, SetStateAction } from "react";
import type { Transform } from "./use-canvas-viewport";
import type { PageEditing } from "./use-page-interaction";

const PAN_THRESHOLD = 8;
const MARKER_DRAG_THRESHOLD = 3;

export type MarkerPreview = { id: string; x: number; y: number };

export type DragRequest =
  | { type: "pan"; startX: number; startY: number }
  | {
      type: "marker";
      startX: number;
      startY: number;
      markerId: string;
      startMarkerX: number;
      startMarkerY: number;
    };

type DragState = DragRequest & { startOffsetX: number; startOffsetY: number; exceeded: boolean };

interface WindowHandlers {
  mouseMove: (event: MouseEvent) => void;
  mouseUp: (event: MouseEvent) => void;
  touchMove: (event: TouchEvent) => void;
  touchEnd: (event: TouchEvent) => void;
}

export type DragContext = {
  dragRef: RefObject<DragState | null>;
  dragMarkerRef: RefObject<MarkerPreview | null>;
  windowHandlersRef: RefObject<WindowHandlers | null>;
  setIsPanning: Dispatch<SetStateAction<boolean>>;
  setDragMarker: Dispatch<SetStateAction<MarkerPreview | null>>;
  setTransform: Dispatch<SetStateAction<Transform>>;
  imgRef: RefObject<HTMLImageElement | HTMLCanvasElement | null>;
  transform: Transform;
  onFocusMarker: PageEditing["onFocusMarker"];
  onMoveMarker: PageEditing["onMoveMarker"];
  tryAddMarker: (x: number, y: number, alternate: boolean) => void;
};

export function clearDragListeners(ref: DragContext["windowHandlersRef"]): void {
  const handlers = ref.current;
  if (!handlers) return;
  removeEventListener("mousemove", handlers.mouseMove);
  removeEventListener("mouseup", handlers.mouseUp);
  removeEventListener("touchmove", handlers.touchMove);
  removeEventListener("touchend", handlers.touchEnd);
  ref.current = null;
}

function moveDrag(context: DragContext, clientX: number, clientY: number): void {
  const drag = context.dragRef.current;
  if (!drag) return;

  const dx = clientX - drag.startX;
  const dy = clientY - drag.startY;

  if (!drag.exceeded) {
    if (Math.hypot(dx, dy) > (drag.type === "pan" ? PAN_THRESHOLD : MARKER_DRAG_THRESHOLD)) {
      drag.exceeded = true;
      if (drag.type === "pan") context.setIsPanning(true);
    } else {
      return;
    }
  }

  if (drag.type === "pan") {
    context.setTransform((prev) => ({
      ...prev,
      offsetX: drag.startOffsetX + dx,
      offsetY: drag.startOffsetY + dy,
    }));
    return;
  }

  const img = context.imgRef.current;
  if (!img) return;

  const rect = img.getBoundingClientRect();
  const nextMarker = {
    id: drag.markerId,
    x: Math.max(0, Math.min(1, drag.startMarkerX + dx / rect.width)),
    y: Math.max(0, Math.min(1, drag.startMarkerY + dy / rect.height)),
  };

  context.dragMarkerRef.current = nextMarker;
  context.setDragMarker(nextMarker);
}

function endDrag(context: DragContext, clientX: number, clientY: number): void {
  const drag = context.dragRef.current;
  context.dragRef.current = null;
  context.setIsPanning(false);
  clearDragListeners(context.windowHandlersRef);

  if (!drag) return;

  if (!drag.exceeded) {
    if (drag.type === "pan") {
      context.tryAddMarker(clientX, clientY, true);
    } else {
      if (drag.markerId) context.onFocusMarker(drag.markerId);
    }
    return;
  }

  if (drag.type !== "marker") return;

  const preview = context.dragMarkerRef.current;
  const nextX = preview?.id === drag.markerId ? preview.x : drag.startMarkerX;
  const nextY = preview?.id === drag.markerId ? preview.y : drag.startMarkerY;

  if (drag.markerId) {
    context.onMoveMarker(drag.markerId, nextX, nextY);
  }

  context.dragMarkerRef.current = null;
  context.setDragMarker(null);
}

function bindDragListeners(context: DragContext): void {
  const handleMouseMove = (e: MouseEvent): void => {
    moveDrag(context, e.clientX, e.clientY);
  };
  const handleMouseUp = (e: MouseEvent): void => {
    endDrag(context, e.clientX, e.clientY);
  };
  const handleTouchMove = (e: TouchEvent): void => {
    const touch = e.touches[0];
    if (touch) moveDrag(context, touch.clientX, touch.clientY);
  };
  const handleTouchEnd = (e: TouchEvent): void => {
    const touch = e.changedTouches[0];
    if (touch) endDrag(context, touch.clientX, touch.clientY);
  };

  addEventListener("mousemove", handleMouseMove);
  addEventListener("mouseup", handleMouseUp);
  addEventListener("touchmove", handleTouchMove, { passive: true });
  addEventListener("touchend", handleTouchEnd);
  context.windowHandlersRef.current = {
    mouseMove: handleMouseMove,
    mouseUp: handleMouseUp,
    touchMove: handleTouchMove,
    touchEnd: handleTouchEnd,
  };
}

export function startPageDrag(request: DragRequest, context: DragContext): void {
  context.dragRef.current = {
    ...request,
    startOffsetX: context.transform.offsetX,
    startOffsetY: context.transform.offsetY,
    exceeded: false,
  };
  bindDragListeners(context);
}
