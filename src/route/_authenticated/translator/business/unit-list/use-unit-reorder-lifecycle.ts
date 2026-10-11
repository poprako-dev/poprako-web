import { useEffect, useRef, type RefObject } from "react";
import { unitId, type UnitInfo } from "@/route/_authenticated/translator/business/unit/unit";
import type { DragSession } from "./unit-reorder-types";

export function useUnitReorderExternalOrder(
  units: UnitInfo[],
  dragRef: RefObject<DragSession | null>,
  cancelDrag: () => void,
): void {
  const externalOrder = units.map(unitId).join("\u{0}");
  const previousExternalOrderRef = useRef(externalOrder);
  useEffect(() => {
    const isOrderChanged = previousExternalOrderRef.current !== externalOrder;
    previousExternalOrderRef.current = externalOrder;
    if (isOrderChanged && dragRef.current) cancelDrag();
  }, [cancelDrag, dragRef, externalOrder]);
}

export function useUnitReorderCleanup(
  dragRef: RefObject<DragSession | null>,
  stopAutoScroll: () => void,
): void {
  useEffect(
    () => () => {
      stopAutoScroll();
      const session = dragRef.current;
      dragRef.current = null;
      if (session?.captureTarget.hasPointerCapture(session.pointerId)) {
        session.captureTarget.releasePointerCapture(session.pointerId);
      }
    },
    [dragRef, stopAutoScroll],
  );
}
