import clsx from "clsx";
import { ListCheck } from "lucide-react";
import type { TranslatorMode } from "@/types/translatorMode";
import { unitId, unitIsProofread, type UnitInfo, type UnitEdit } from "@/types/unit";
import TranslateModeUnitItem from "./TranslateModeUnitItem";
import ProofreadModeUnitItem from "./ProofreadModeUnitItem";
import { useToastStore } from "@/components/ui/NotificationToast/hooks";
import { useEffect, useRef } from "react";

export type SpecialCharInsertRequest = {
  id: number;
  char: string;
};

type Props = {
  units: UnitInfo[];
  focusedUnitId?: string;
  mode: TranslatorMode;
  onFocusUnit?: (unitId: string) => void;
  // 在 units 长度为 0 时，不存在这个字段
  onModifyUnit?: (unitId: string, unit: UnitEdit) => void;
  enableReadOnly?: boolean;
  specialCharInsertRequest?: SpecialCharInsertRequest;
  onSpecialCharUse?: (char: string) => void;
};

export default function UnitList({
  units,
  focusedUnitId,
  mode,
  onFocusUnit,
  onModifyUnit,
  enableReadOnly = false,
  specialCharInsertRequest,
  onSpecialCharUse,
}: Props) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focusedUnitId && listRef.current) {
      const focusedElement = listRef.current.querySelector(
        `[data-unit-id="${focusedUnitId}"]`,
      );
      if (focusedElement) {
        focusedElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [focusedUnitId]);

  const ItemComponent =
    mode === "translate" ? TranslateModeUnitItem : ProofreadModeUnitItem;

  const { showToast } = useToastStore();
  const allUnitsProofread = units.length > 0 && units.every(unitIsProofread);

  const proofreadAll = () => {
    units.forEach((unit) =>
      onModifyUnit?.(unitId(unit), { isProofread: !allUnitsProofread }),
    );
    showToast(allUnitsProofread ? "已取消全部校对" : "全部校对已确认", "success");
  };

  return (
    <div ref={listRef} className="w-full h-full flex flex-col bg-stone-50">
      <div className="flex-1">
        {units.map((unit) => (
          <ItemComponent
            key={unitId(unit)}
            unit={unit}
            isFocused={focusedUnitId === unitId(unit)}
            onSelect={onFocusUnit}
            onModifyUnit={onModifyUnit}
            dataUnitId={unitId(unit)}
            enableReadOnly={enableReadOnly}
            specialCharInsertRequest={specialCharInsertRequest}
            onSpecialCharUse={onSpecialCharUse}
          />
        ))}
      </div>
      {mode === "proofread" && !enableReadOnly && (
        <button
          type="button"
          title={allUnitsProofread ? "取消全部校对" : "全部确认校对"}
          onClick={proofreadAll}
          className={clsx(
            "flex w-full shrink-0 items-center justify-center border-t-2",
            "border-gray-300 bg-stone-50 py-2",
            allUnitsProofread
              ? "text-red-600 hover:bg-red-50 hover:text-red-700"
              : "text-gray-700 hover:bg-stone-200 hover:text-gray-900",
          )}
        >
          <ListCheck size={22} />
        </button>
      )}
    </div>
  );
}
