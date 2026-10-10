import { useCallback, useEffect } from "react";
import type { PageEditing, PageInteraction } from "./use-page-interaction";
import type { DragRequest } from "./page-drag";

type PointerArgs = {
  imgRef: PageInteraction["imgRef"];
  containerRef: PageInteraction["containerRef"];
  startDrag: (request: DragRequest) => void;
};

function useCanvasTouch({ imgRef, containerRef, startDrag }: PointerArgs): void {
  const handleCanvasTouchStart = useCallback(
    (e: TouchEvent) => {
      if ((e.target as HTMLElement).closest("[data-marker], [data-canvas-annotation]")) return;
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
      startDrag({ type: "pan", startX: touch.clientX, startY: touch.clientY });
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
}

export function useCanvasPointer(args: PointerArgs): PageInteraction["handleCanvasMouseDown"] {
  const { imgRef, startDrag } = args;
  useCanvasTouch(args);
  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest("[data-marker], [data-canvas-annotation]")) return;
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
      startDrag({ type: "pan", startX: e.clientX, startY: e.clientY });
    },
    [imgRef, startDrag],
  );

  return handleCanvasMouseDown;
}

export function useMarkerPointer(
  enableReadOnly: boolean,
  onFocusMarker: PageEditing["onFocusMarker"],
  startDrag: PointerArgs["startDrag"],
): Pick<PageInteraction, "handleMarkerMouseDown" | "handleMarkerTouchStart"> {
  const handleMarkerMouseDown = useCallback(
    (e: React.MouseEvent, markerId: string, xCoord: number, yCoord: number) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      if (enableReadOnly) {
        onFocusMarker(markerId);
        return;
      }
      startDrag({
        type: "marker",
        startX: e.clientX,
        startY: e.clientY,
        markerId,
        startMarkerX: xCoord,
        startMarkerY: yCoord,
      });
    },
    [enableReadOnly, onFocusMarker, startDrag],
  );

  const handleMarkerTouchStart = useCallback(
    (e: React.TouchEvent, markerId: string, xCoord: number, yCoord: number) => {
      e.preventDefault();
      e.stopPropagation();
      if (enableReadOnly) {
        onFocusMarker(markerId);
        return;
      }
      const touch = e.touches[0];
      if (!touch) return;
      startDrag({
        type: "marker",
        startX: touch.clientX,
        startY: touch.clientY,
        markerId,
        startMarkerX: xCoord,
        startMarkerY: yCoord,
      });
    },
    [enableReadOnly, onFocusMarker, startDrag],
  );

  return { handleMarkerMouseDown, handleMarkerTouchStart };
}

export function useMarkerCreation(
  imgRef: PageInteraction["imgRef"],
  isMarkerCreationEnabled: boolean,
  onAddMarker: PageEditing["onAddMarker"],
): (x: number, y: number, alternate: boolean) => void {
  const tryAddMarker = useCallback(
    (clientX: number, clientY: number, alternate: boolean) => {
      if (!isMarkerCreationEnabled) return;

      const img = imgRef.current;
      if (!img) return;

      const rect = img.getBoundingClientRect();
      const x = (clientX - rect.left) / rect.width;
      const y = (clientY - rect.top) / rect.height;

      if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
        onAddMarker(x, y, alternate);
      }
    },
    [imgRef, isMarkerCreationEnabled, onAddMarker],
  );

  return tryAddMarker;
}

export function usePageContextMenu(
  enableReadOnly: boolean,
  onDeleteMarker: PageEditing["onDeleteMarker"],
  tryAddMarker: ReturnType<typeof useMarkerCreation>,
): PageInteraction["handleContextMenu"] {
  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (enableReadOnly) return;

      const markerEl =
        e.target instanceof HTMLElement
          ? e.target.closest("[data-marker], [data-canvas-annotation]")
          : null;
      if (markerEl) {
        const markerId = markerEl instanceof HTMLElement ? markerEl.dataset["marker"] : undefined;
        if (markerId) onDeleteMarker(markerId);
        return;
      }

      tryAddMarker(e.clientX, e.clientY, false);
    },
    [enableReadOnly, onDeleteMarker, tryAddMarker],
  );

  return handleContextMenu;
}
