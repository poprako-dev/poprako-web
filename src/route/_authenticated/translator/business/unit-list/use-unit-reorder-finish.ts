import { useCallback, type Dispatch, type RefObject, type SetStateAction } from "react";
import type { DragSession } from "./unit-reorder-types";

export function useUnitReorderFinish(input: {
  dragRef: RefObject<DragSession | null>;
  stopAutoScroll: () => void;
  setPreviewOrder: Dispatch<SetStateAction<string[] | null>>;
  setDraggingUnitId: Dispatch<SetStateAction<string | null>>;
  onActivateUnitRef: RefObject<((unitId: string) => void) | undefined>;
  onReorderUnitRef: RefObject<((unitId: string, targetIndex: number) => void) | undefined>;
}): {
  finishDrag: (commit: boolean, activate: boolean) => void;
  cancelDrag: () => void;
} {
  const {
    dragRef,
    stopAutoScroll,
    setPreviewOrder,
    setDraggingUnitId,
    onActivateUnitRef,
    onReorderUnitRef,
  } = input;
  const finishDrag = useCallback(
    (commit: boolean, activate: boolean) => {
      const session = dragRef.current;
      if (!session) return;
      dragRef.current = null;
      stopAutoScroll();
      setPreviewOrder(null);
      setDraggingUnitId(null);
      releasePointerCapture(session);
      if (activate) {
        onActivateUnitRef.current?.(session.unitId);
        return;
      }
      if (commit && session.didDrag) commitReorder(session, onReorderUnitRef.current);
    },
    [
      dragRef,
      onActivateUnitRef,
      onReorderUnitRef,
      setDraggingUnitId,
      setPreviewOrder,
      stopAutoScroll,
    ],
  );
  const cancelDrag = useCallback(() => {
    finishDrag(false, false);
  }, [finishDrag]);
  return { finishDrag, cancelDrag };
}

function releasePointerCapture(session: DragSession): void {
  if (session.captureTarget.hasPointerCapture(session.pointerId)) {
    session.captureTarget.releasePointerCapture(session.pointerId);
  }
}

function commitReorder(
  session: DragSession,
  onReorderUnit: ((unitId: string, targetIndex: number) => void) | undefined,
): void {
  const targetIndex = session.previewOrder.indexOf(session.unitId);
  if (targetIndex !== session.sourceIndex) onReorderUnit?.(session.unitId, targetIndex);
}
