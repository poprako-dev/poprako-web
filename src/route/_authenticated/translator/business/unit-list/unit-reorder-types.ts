import type { PointerEvent as ReactPointerEvent, RefObject } from "react";
import type { UnitInfo } from "@/route/_authenticated/translator/business/unit/unit";

export type UnitReorderArgs = {
  units: UnitInfo[];
  listRef: RefObject<HTMLDivElement | null>;
  enabled: boolean;
  onActivateUnit?: ((unitId: string) => void) | undefined;
  onReorderUnit?: ((unitId: string, targetIndex: number) => void) | undefined;
};

export type UnitReorderResult = {
  orderedUnits: UnitInfo[];
  draggingUnitId: string | null;
  handleIndexPointerDown: (
    event: ReactPointerEvent<HTMLButtonElement>,
    targetUnitId: string,
  ) => void;
};

export type DragSession = {
  pointerId: number;
  unitId: string;
  startX: number;
  startY: number;
  lastClientY: number;
  sourceIndex: number;
  didDrag: boolean;
  previewOrder: string[];
  captureTarget: HTMLDivElement;
};
