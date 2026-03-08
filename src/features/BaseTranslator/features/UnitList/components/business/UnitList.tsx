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

  return (
    <div className="w-full h-full">
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
  );
}
