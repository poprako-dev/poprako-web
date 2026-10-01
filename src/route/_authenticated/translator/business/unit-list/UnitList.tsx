import type { JSX } from "react/jsx-runtime";
import clsx from "clsx";
import { ListCheck } from "lucide-react";
import { Tooltip } from "radix-ui";
import { useEffect, useRef } from "react";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import type { TranslatorMode } from "@/route/_authenticated/translator/business/unit/translator-mode";
import {
  unitId,
  type UnitInfo,
  unitIsBubble,
  unitIsProofread,
  unitProofreaderId,
  unitTranslatorId,
} from "@/route/_authenticated/translator/business/unit/unit";
import type { UnitEdit } from "@/route/_authenticated/translator/business/unit/unit-edit";
import { useUnitReorder } from "@/route/_authenticated/translator/business/unit-list/use-unit-reorder";
import { useUnitContributors } from "@/route/_authenticated/translator/business/unit-list/use-unit-contributors";
import type { UnitUserResolver } from "@/route/_authenticated/translator/business/unit-list/unit-contributor-cache";
import { TranslateModeUnitItem } from "@/route/_authenticated/translator/business/unit-list/TranslateModeUnitItem";
import { ProofreadModeUnitItem } from "@/route/_authenticated/translator/business/unit-list/ProofreadModeUnitItem";
import { ReadOnlyDiffUnitItem } from "@/route/_authenticated/translator/business/unit-list/ReadOnlyDiffUnitItem";
import type { SpecialCharsBarController } from "@/route/_authenticated/translator/business/preference/use-detachable-special-chars-bar";

export type SpecialCharInsertRequest = {
  id: number;
  char: string;
  targetUnitId: string;
};

type Props = {
  units: UnitInfo[];
  pendingUnitIds?: string[] | undefined;
  focusedUnitId?: string | undefined;
  mode: TranslatorMode;
  onFocusUnit?: ((unitId: string) => void) | undefined;
  editing: {
    modifyUnit: (unitId: string, unit: UnitEdit) => void;
    reorderUnit?: (unitId: string, targetIndex: number) => void;
  } | null;
  onResolveUser: UnitUserResolver;
  enableReadOnly?: boolean | undefined;
  specialCharInsertRequest?: SpecialCharInsertRequest | undefined;
  specialCharsBar?: SpecialCharsBarController | undefined;
  onSpecialCharUse?: ((char: string) => void) | undefined;
  onSpecialCharInserted?: ((requestId: number, char: string) => void) | undefined;
};

export function UnitList({
  units,
  pendingUnitIds,
  focusedUnitId,
  mode,
  onFocusUnit,
  editing,
  onResolveUser,
  enableReadOnly = false,
  specialCharInsertRequest,
  specialCharsBar,
  onSpecialCharUse,
  onSpecialCharInserted,
}: Props): JSX.Element {
  const onModifyUnit = editing?.modifyUnit;
  const onReorderUnit = editing?.reorderUnit;
  const readOnly = enableReadOnly || editing === null || mode === "readOnly";
  const listRef = useRef<HTMLDivElement>(null);
  const canReorder = !readOnly && onReorderUnit !== undefined;
  const canToggleBubble = !readOnly && onModifyUnit !== undefined;
  const activateIndex = (targetUnitId: string): void => {
    const targetUnit = units.find((unit) => unitId(unit) === targetUnitId);
    if (canToggleBubble && targetUnit) {
      onModifyUnit(targetUnitId, { isBubble: !unitIsBubble(targetUnit) });
      return;
    }
    onFocusUnit?.(targetUnitId);
  };
  const { orderedUnits, draggingUnitId, handleIndexPointerDown } = useUnitReorder({
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

  const proofreadAll = (): void => {
    if (readOnly || !onModifyUnit || units.length === 0) return;
    for (const unit of units) {
      onModifyUnit(unitId(unit), { isProofread: !isAllUnitsProofread });
    }
    showToast(isAllUnitsProofread ? "已取消全部校对" : "全部校对已确认", "success");
  };

  return (
    <Tooltip.Provider>
      <div className="flex h-full w-full flex-col overflow-hidden bg-surface-stone-50">
        <div
          ref={listRef}
          className={clsx("min-h-0 flex-1 overflow-y-auto", draggingUnitId && "select-none")}
        >
          {orderedUnits.map((unit) => {
            const commonProps = {
              unit,
              hasLocalDraft: pendingUnitIds?.includes(unitId(unit)),
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

            const ItemComponent =
              mode === "translate" ? TranslateModeUnitItem : ProofreadModeUnitItem;
            return (
              <ItemComponent
                key={unitId(unit)}
                {...commonProps}
                canToggleBubble={canToggleBubble}
                onModifyUnit={onModifyUnit}
                onIndexPointerDown={canReorder ? handleIndexPointerDown : undefined}
                isDragging={draggingUnitId === unitId(unit)}
                isDragDimmed={draggingUnitId !== null && draggingUnitId !== unitId(unit)}
                showDropIndicator={draggingUnitId === unitId(unit)}
                enableReadOnly={readOnly}
                specialCharInsertRequest={specialCharInsertRequest}
                specialCharsBar={specialCharsBar}
                onSpecialCharUse={onSpecialCharUse}
                onSpecialCharInserted={onSpecialCharInserted}
              />
            );
          })}
        </div>
        {mode === "proofread" && !readOnly && (
          <button
            type="button"
            title={isAllUnitsProofread ? "取消全部校对" : "全部确认校对"}
            onClick={proofreadAll}
            className={clsx(
              "flex w-full shrink-0 items-center justify-center border-t-2",
              "border-line-gray-300 bg-surface-stone-50 py-2",
              isAllUnitsProofread
                ? "text-ink-red-600 hover:bg-surface-red-50 hover:text-ink-red-700"
                : "text-ink-gray-700 hover:bg-surface-stone-200 hover:text-ink-gray-900",
            )}
          >
            <ListCheck size={22} />
          </button>
        )}
      </div>
    </Tooltip.Provider>
  );
}
