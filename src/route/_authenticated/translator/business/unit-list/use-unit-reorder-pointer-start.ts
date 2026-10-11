import { useCallback, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import { unitId, type UnitInfo } from "@/route/_authenticated/translator/business/unit/unit";
import type { DragSession, UnitReorderResult } from "./unit-reorder-types";

export function useUnitReorderPointerStart(input: {
  unitsRef: RefObject<UnitInfo[]>;
  enabledRef: RefObject<boolean>;
  dragRef: RefObject<DragSession | null>;
  listRef: RefObject<HTMLDivElement | null>;
  cancelDrag: () => void;
}): UnitReorderResult["handleIndexPointerDown"] {
  const { unitsRef, enabledRef, dragRef, listRef, cancelDrag } = input;
  return useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>, targetUnitId: string) => {
      if (!enabledRef.current || !event.isPrimary) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;
      const order = unitsRef.current.map(unitId);
      const sourceIndex = order.indexOf(targetUnitId);
      const list = listRef.current;
      if (sourceIndex === -1 || !list) return;
      if (dragRef.current) cancelDrag();
      event.stopPropagation();
      list.setPointerCapture(event.pointerId);
      dragRef.current = createDragSession(event, targetUnitId, sourceIndex, order, list);
    },
    [cancelDrag, dragRef, enabledRef, listRef, unitsRef],
  );
}

function createDragSession(
  event: ReactPointerEvent<HTMLButtonElement>,
  targetUnitId: string,
  sourceIndex: number,
  order: string[],
  list: HTMLDivElement,
): DragSession {
  return {
    pointerId: event.pointerId,
    unitId: targetUnitId,
    startX: event.clientX,
    startY: event.clientY,
    lastClientY: event.clientY,
    sourceIndex,
    didDrag: false,
    previewOrder: order,
    captureTarget: list,
  };
}
