import clsx from "clsx";
import { ListCheck } from "lucide-react";
import { Tooltip } from "radix-ui";
import { useEffect, useRef } from "react";
import { useToastStore } from "@/components/ui/NotificationToast/hooks";
import type { TranslatorMode } from "@/types/translatorMode";
import {
  unitId,
  unitIsBubble,
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
import ReadOnlyDiffUnitItem from "./ReadOnlyDiffUnitItem";
import type { SpecialCharsBarController } from "../../../../hook/useDetachableSpecialCharsBar";

export interface SpecialCharInsertRequest {
  id: number;
  char: string;
  targetUnitId: string;
}

interface Props {
  units: UnitInfo[];
  focusedUnitId?: string | undefined;
  mode: TranslatorMode;
  onFocusUnit?: ((unitId: string) => void) | undefined;
  // 在 units 长度为 0 时，不存在这个字段
  onModifyUnit?: ((unitId: string, unit: UnitEdit) => void) | undefined;
  onReorderUnit?: ((unitId: string, targetIndex: number) => void) | undefined;
  onResolveUser: UnitUserResolver;
  enableReadOnly?: boolean | undefined;
  specialCharInsertRequest?: SpecialCharInsertRequest | undefined;
  specialCharsBar?: SpecialCharsBarController | undefined;
  onSpecialCharUse?: ((char: string) => void) | undefined;
  onSpecialCharInserted?: ((requestId: number, char: string) => void) | undefined;
}

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
  specialCharsBar,
  onSpecialCharUse,
  onSpecialCharInserted,
}: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  const canReorder = !enableReadOnly && onReorderUnit !== undefined;
  const canToggleBubble = !enableReadOnly && onModifyUnit !== undefined;
  const activateIndex = (targetUnitId: string) => {
    const targetUnit = units.find((unit) => unitId(unit) === targetUnitId);
    if (canToggleBubble && targetUnit) {
      onModifyUnit(targetUnitId, { isBubble: !unitIsBubble(targetUnit) });
      return;
    }
    onFocusUnit?.(targetUnitId);
  };
  const { orderedUnits, draggingUnitId, handleIndexPointerDown } =
    useUnitReorder({
      units,
      listRef,
      enabled: canReorder,
      onActivateUnit: activateIndex,
      onReorderUnit,
    });
  const getContributor = useUnitContributors({ units, onResolveUser });

  useEffect(() => {
    if (!(focusedUnitId && listRef.current)) {
      return;
    }

    const focusedElement = listRef.current.querySelector(
      `[data-unit-id="${CSS.escape(focusedUnitId)}"]`,
    );
    if (focusedElement) {
      focusedElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [focusedUnitId]);

  const { showToast } = useToastStore();
  const isAllUnitsProofread = units.length > 0 && units.every(unitIsProofread);

  const proofreadAll = () => {
    for (const unit of units) {onModifyUnit?.(unitId(unit), { isProofread: !isAllUnitsProofread })
    ;}
    showToast(isAllUnitsProofread ? "已取消全部校对" : "全部校对已确认", "success");
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
          {orderedUnits.map((unit) => {
            const commonProps = {
              unit,
              isFocused: focusedUnitId === unitId(unit),
              onSelect: onFocusUnit,
              onIndexActivate: activateIndex,
              translator: getContributor(unitTranslatorId(unit)),
              proofreader: getContributor(unitProofreaderId(unit)),
              dataUnitId: unitId(unit),
            };
            if (mode === "readOnly") {
              return <ReadOnlyDiffUnitItem key={unitId(unit)} {...commonProps} />;
            }

            const ItemComponent = mode === "translate"
              ? TranslateModeUnitItem
              : ProofreadModeUnitItem;
            return (
              <ItemComponent
                key={unitId(unit)}
                {...commonProps}
                canToggleBubble={canToggleBubble}
                onModifyUnit={onModifyUnit}
                onIndexPointerDown={
                  canReorder ? handleIndexPointerDown : undefined
                }
                isDragging={draggingUnitId === unitId(unit)}
                isDragDimmed={
                  draggingUnitId !== null && draggingUnitId !== unitId(unit)
                }
                showDropIndicator={draggingUnitId === unitId(unit)}
                enableReadOnly={enableReadOnly}
                specialCharInsertRequest={specialCharInsertRequest}
                specialCharsBar={specialCharsBar}
                onSpecialCharUse={onSpecialCharUse}
                onSpecialCharInserted={onSpecialCharInserted}
              />
            );
          })}
        </div>
        {mode === "proofread" && !enableReadOnly && (
          <button
            type="button"
            title={isAllUnitsProofread ? "取消全部校对" : "全部确认校对"}
            onClick={proofreadAll}
            className={clsx(
              "flex w-full shrink-0 items-center justify-center border-t-2",
              "border-gray-300 bg-stone-50 py-2",
              isAllUnitsProofread
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
