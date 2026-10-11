import { useMemo } from "react";
import { normalizeUnitIndexes, unitId } from "@/route/_authenticated/translator/business/unit/unit";
import type { UnitReorderArgs, UnitReorderResult } from "./unit-reorder-types";
import { useUnitReorderDrag } from "./use-unit-reorder-drag";

export function useUnitReorder({ units, ...dragArgs }: UnitReorderArgs): UnitReorderResult {
  const drag = useUnitReorderDrag({ units, ...dragArgs });
  const orderedUnits = useOrderedUnits(units, drag.previewOrder);
  return {
    orderedUnits,
    draggingUnitId: drag.draggingUnitId,
    handleIndexPointerDown: drag.handleIndexPointerDown,
  };
}

function useOrderedUnits(
  units: UnitReorderArgs["units"],
  previewOrder: string[] | null,
): UnitReorderResult["orderedUnits"] {
  return useMemo(() => {
    if (!previewOrder) return units;
    const unitsById = new Map(units.map((unit) => [unitId(unit), unit]));
    const reorderedUnits = previewOrder.flatMap((id) => {
      const unit = unitsById.get(id);
      return unit ? [unit] : [];
    });
    return normalizeUnitIndexes(reorderedUnits);
  }, [previewOrder, units]);
}
