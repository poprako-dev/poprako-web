import { useCallback, useEffect, type Dispatch, type RefObject, type SetStateAction } from "react";
import { isBeyondDragThreshold } from "./drag-threshold";
import { shouldIgnoreWorkbenchKey } from "@/shared/utility/keyboard-scope";
import type { DragSession } from "./unit-reorder-types";

export function useUnitReorderPointerMove(input: {
  dragRef: RefObject<DragSession | null>;
  setDraggingUnitId: Dispatch<SetStateAction<string | null>>;
  setPreviewOrder: Dispatch<SetStateAction<string[] | null>>;
  updatePreviewOrder: (clientY: number) => void;
  scheduleAutoScroll: () => void;
}): (event: PointerEvent) => void {
  const { dragRef, setDraggingUnitId, setPreviewOrder, updatePreviewOrder, scheduleAutoScroll } =
    input;
  return useCallback(
    (event: PointerEvent) => {
      const session = dragRef.current;
      if (event.pointerId !== session?.pointerId) return;
      session.lastClientY = event.clientY;
      if (!session.didDrag && !beginDrag(event, session)) return;
      if (!session.didDrag) {
        session.didDrag = true;
        setDraggingUnitId(session.unitId);
        setPreviewOrder(session.previewOrder);
      }
      event.preventDefault();
      updatePreviewOrder(event.clientY);
      scheduleAutoScroll();
    },
    [dragRef, scheduleAutoScroll, setDraggingUnitId, setPreviewOrder, updatePreviewOrder],
  );
}

function beginDrag(event: PointerEvent, session: DragSession): boolean {
  const deltaX = event.clientX - session.startX;
  const deltaY = event.clientY - session.startY;
  return isBeyondDragThreshold(event.pointerType, deltaX, deltaY);
}

export function useUnitReorderPointerEvents(
  dragRef: RefObject<DragSession | null>,
  finishDrag: (commit: boolean, activate: boolean) => void,
  cancelDrag: () => void,
  handlePointerMove: (event: PointerEvent) => void,
): void {
  const handlePointerUp = useCallback(
    (event: PointerEvent) => {
      const session = dragRef.current;
      if (event.pointerId !== session?.pointerId) return;
      finishDrag(session.didDrag, !session.didDrag);
    },
    [dragRef, finishDrag],
  );
  const cancelMatchingPointer = useCallback(
    (event: PointerEvent) => {
      if (dragRef.current?.pointerId === event.pointerId) cancelDrag();
    },
    [cancelDrag, dragRef],
  );
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (shouldIgnoreWorkbenchKey(event, "[data-unit-id]")) return;
      if (event.key !== "Escape" || !dragRef.current) return;
      event.preventDefault();
      cancelDrag();
    },
    [cancelDrag, dragRef],
  );
  usePointerEventListeners(
    handlePointerMove,
    handlePointerUp,
    cancelMatchingPointer,
    handleKeyDown,
  );
}

function usePointerEventListeners(
  handlePointerMove: (event: PointerEvent) => void,
  handlePointerUp: (event: PointerEvent) => void,
  cancelMatchingPointer: (event: PointerEvent) => void,
  handleKeyDown: (event: KeyboardEvent) => void,
): void {
  useEffect(() => {
    globalThis.addEventListener("pointermove", handlePointerMove, { passive: false });
    globalThis.addEventListener("pointerup", handlePointerUp);
    globalThis.addEventListener("pointercancel", cancelMatchingPointer);
    globalThis.addEventListener("lostpointercapture", cancelMatchingPointer, { capture: true });
    globalThis.addEventListener("keydown", handleKeyDown);
    return () => {
      globalThis.removeEventListener("pointermove", handlePointerMove);
      globalThis.removeEventListener("pointerup", handlePointerUp);
      globalThis.removeEventListener("pointercancel", cancelMatchingPointer);
      globalThis.removeEventListener("lostpointercapture", cancelMatchingPointer, true);
      globalThis.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown, handlePointerMove, handlePointerUp, cancelMatchingPointer]);
}
