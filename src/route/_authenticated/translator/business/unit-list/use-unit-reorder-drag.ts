import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import type { UnitReorderArgs } from "./unit-reorder-types";
import type { DragSession } from "./unit-reorder-types";
import { useUnitReorderAutoScroll } from "./use-unit-reorder-auto-scroll";
import { useUnitReorderCleanup, useUnitReorderExternalOrder } from "./use-unit-reorder-lifecycle";
import { useUnitReorderFinish } from "./use-unit-reorder-finish";
import {
  useUnitReorderPointerEvents,
  useUnitReorderPointerMove,
} from "./use-unit-reorder-pointer-events";
import { useUnitReorderPointerStart } from "./use-unit-reorder-pointer-start";
import { useUnitReorderPreview } from "./use-unit-reorder-preview";

export function useUnitReorderDrag({
  units,
  listRef,
  enabled,
  onActivateUnit,
  onReorderUnit,
}: UnitReorderArgs): {
  previewOrder: string[] | null;
  draggingUnitId: string | null;
  handleIndexPointerDown: ReturnType<typeof useUnitReorderPointerStart>;
} {
  const [previewOrder, setPreviewOrder] = useState<string[] | null>(null);
  const [draggingUnitId, setDraggingUnitId] = useState<string | null>(null);
  const latest = useReorderLatestValues({ units, enabled, onActivateUnit, onReorderUnit });
  const dragRef = useRef<DragSession | null>(null);
  const autoScrollFrameRef = useRef<number | null>(null);
  const updatePreviewOrder = useUnitReorderPreview(listRef, dragRef, setPreviewOrder);
  const autoScroll = useUnitReorderAutoScroll(
    listRef,
    dragRef,
    autoScrollFrameRef,
    updatePreviewOrder,
  );
  const { finishDrag, cancelDrag } = useUnitReorderFinish({
    dragRef,
    stopAutoScroll: autoScroll.stopAutoScroll,
    setPreviewOrder,
    setDraggingUnitId,
    onActivateUnitRef: latest.onActivateUnitRef,
    onReorderUnitRef: latest.onReorderUnitRef,
  });
  useReorderEvents(dragRef, finishDrag, cancelDrag, {
    setDraggingUnitId,
    setPreviewOrder,
    updatePreviewOrder,
    scheduleAutoScroll: autoScroll.scheduleAutoScroll,
  });
  useUnitReorderExternalOrder(units, dragRef, cancelDrag);
  useUnitReorderCleanup(dragRef, autoScroll.stopAutoScroll);
  const handleIndexPointerDown = useUnitReorderPointerStart({
    unitsRef: latest.unitsRef,
    enabledRef: latest.enabledRef,
    dragRef,
    listRef,
    cancelDrag,
  });
  return { previewOrder, draggingUnitId, handleIndexPointerDown };
}

type LatestUnitReorderValues = {
  unitsRef: { current: UnitReorderArgs["units"] };
  enabledRef: { current: boolean };
  onActivateUnitRef: { current: UnitReorderArgs["onActivateUnit"] };
  onReorderUnitRef: { current: UnitReorderArgs["onReorderUnit"] };
};

function useReorderLatestValues(
  input: Pick<UnitReorderArgs, "units" | "enabled" | "onActivateUnit" | "onReorderUnit">,
): LatestUnitReorderValues {
  return {
    unitsRef: useLatest(input.units),
    enabledRef: useLatest(input.enabled),
    onActivateUnitRef: useLatest(input.onActivateUnit),
    onReorderUnitRef: useLatest(input.onReorderUnit),
  };
}

function useReorderEvents(
  dragRef: RefObject<DragSession | null>,
  finishDrag: (commit: boolean, activate: boolean) => void,
  cancelDrag: () => void,
  moveState: {
    setDraggingUnitId: React.Dispatch<React.SetStateAction<string | null>>;
    setPreviewOrder: React.Dispatch<React.SetStateAction<string[] | null>>;
    updatePreviewOrder: (clientY: number) => void;
    scheduleAutoScroll: () => void;
  },
): void {
  const handlePointerMove = useUnitReorderPointerMove({ dragRef, ...moveState });
  useUnitReorderPointerEvents(dragRef, finishDrag, cancelDrag, handlePointerMove);
}

function useLatest<T>(value: T): { current: T } {
  const ref = useRef(value);
  useLayoutEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}
