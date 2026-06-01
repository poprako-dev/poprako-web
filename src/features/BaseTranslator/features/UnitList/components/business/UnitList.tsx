import clsx from "clsx";
import { ListCheck } from "lucide-react";
import type { TranslatorMode } from "@/types/translatorMode";
import { unitId, type UnitInfo, type UnitEdit } from "@/types/unit";
import TranslateModeUnitItem from "./TranslateModeUnitItem";
import ProofreadModeUnitItem from "./ProofreadModeUnitItem";
import { useEffect, useRef } from "react";

type Props = {
  units: UnitInfo[];
  focusedUnitId?: string;
  mode: TranslatorMode;
  onFocusUnit?: (unitId: string) => void;
  // 在 units 长度为 0 时，不存在这个字段
  onModifyUnit?: (unitId: string, unit: UnitEdit) => void;
  enableReadOnly?: boolean;
};

export default function UnitList({
  units,
  focusedUnitId,
  mode,
  onFocusUnit,
  onModifyUnit,
  enableReadOnly = false,
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

  const proofreadAll = () => {
    units.forEach((unit) =>
      onModifyUnit?.(unitId(unit), { isProofread: true }),
    );
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
          />
        ))}
      </div>
      {mode === "proofread" && !enableReadOnly && (
        <div className="flex border-t-2 border-gray-300 text-base justify-center px-0 py-2 bg-stone-50">
          <button
            title="全部确认校对"
            onClick={proofreadAll}
            className={clsx(
              "rounded",
              "text-gray-700 font-bold hover:text-gray-900 transition-colors",
            )}
          >
            <ListCheck size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
