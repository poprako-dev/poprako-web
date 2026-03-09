import clsx from "clsx";
import { ListCheck } from "lucide-react";
import type { TranslatorMode } from "@/types/translatorMode";
import type { Unit } from "@/types/unit";
import TranslateModeUnitItem from "./TranslateModeUnitItem";
import ProofreadModeUnitItem from "./ProofreadModeUnitItem";

type Props = {
  units: Unit[];
  focusedUnitId?: string;
  mode: TranslatorMode;
  onFocusUnit?: (unitId: string) => void;
  // 在 units 长度为 0 时，不存在这个字段
  onModifyUnit?: (unitId: string, unit: Partial<Unit>) => void;
};

export default function UnitList({
  units,
  focusedUnitId,
  mode,
  onFocusUnit,
  onModifyUnit,
}: Props) {
  const ItemComponent =
    mode === "translate" ? TranslateModeUnitItem : ProofreadModeUnitItem;

  const proveAll = () => {
    units.forEach((u) => onModifyUnit?.(u.id, { proved: true }));
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1">
        {units.map((unit) => (
          <ItemComponent
            key={unit.id}
            unit={unit}
            isFocused={focusedUnitId === unit.id}
            onSelect={onFocusUnit}
            onModifyUnit={onModifyUnit}
          />
        ))}
      </div>
      {mode === "proofread" && (
        <div className="flex justify-center px-0 py-1">
          <button
            title="全部确认校对"
            onClick={proveAll}
            className={clsx(
              "p-1 rounded",
              "text-gray-400 hover:text-gray-600 transition-colors",
            )}
          >
            <ListCheck size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
