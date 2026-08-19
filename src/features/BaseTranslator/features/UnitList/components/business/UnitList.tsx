import clsx from "clsx";
import { ListCheck } from "lucide-react";
import { Tooltip } from "radix-ui";
import { useEffect, useRef } from "react";
import { useToastStore } from "@/components/ui/NotificationToast/hooks";
import type { TranslatorMode } from "@/types/translatorMode";
import {
  unitId,
  unitIsProofread,
  unitProofreaderId,
  unitTranslatorId,
  type UnitInfo,
  type UnitEdit,
} from "@/types/unit";
import { useUnitReorder } from "../../hook/useUnitReorder";
import { useUnitContributors } from "../../hook/useUnitContributors";
import type { UnitUserResolver } from "../../hook/unitContributorCache";
import TranslateModeUnitItem from "./TranslateModeUnitItem";
import ProofreadModeUnitItem from "./ProofreadModeUnitItem";

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
  onReorderUnit?: (unitId: string, targetIndex: number) => void;
  onResolveUser: UnitUserResolver;
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
  onReorderUnit,
  onResolveUser,
  enableReadOnly = false,
  specialCharInsertRequest,
  onSpecialCharUse,
}: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  const canReorder = !enableReadOnly && onReorderUnit !== undefined;
  const { orderedUnits, draggingUnitId, handleIndexPointerDown } =
    useUnitReorder({
      units,
      listRef,
      enabled: canReorder,
      onFocusUnit,
      onReorderUnit,
    });
  const getContributor = useUnitContributors({ units, onResolveUser });

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
    <Tooltip.Provider>
      <div className="flex h-full w-full flex-col overflow-hidden bg-stone-50">
        <div
          ref={listRef}
          className={clsx(
            "min-h-0 flex-1 overflow-y-auto",
            draggingUnitId && "select-none",
          )}
        >
          {orderedUnits.map((unit) => (
            <ItemComponent
              key={unitId(unit)}
              unit={unit}
              isFocused={focusedUnitId === unitId(unit)}
              onSelect={onFocusUnit}
              onModifyUnit={onModifyUnit}
              onIndexPointerDown={
                canReorder ? handleIndexPointerDown : undefined
              }
              isDragging={draggingUnitId === unitId(unit)}
              isDragDimmed={
                draggingUnitId !== null && draggingUnitId !== unitId(unit)
              }
              showDropIndicator={draggingUnitId === unitId(unit)}
              translator={getContributor(unitTranslatorId(unit))}
              proofreader={getContributor(unitProofreaderId(unit))}
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
    </Tooltip.Provider>
  );
}
