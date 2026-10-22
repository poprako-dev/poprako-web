import { useCommittedCallback } from "@/shared/hook/use-committed-callback";
import { UnitListItem, type UnitItemComponent } from "./UnitListItem";
import type { JSX } from "react/jsx-runtime";
import type { RefObject } from "react";
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
import type { SpecialCharsBarController } from "@/route/_authenticated/translator/business/preference/use-detachable-special-chars-bar";
import type { UnitAnnotationSource } from "../contract/unit-annotations";

export type SpecialCharInsertRequest = {
  id: number;
  char: string;
  targetUnitId: string;
};

export type UnitListProps = {
  annotations?: UnitAnnotationSource | undefined;
  isAnnotationEditingEnabled?: boolean | undefined;
  units: UnitInfo[];
  pendingUnitIds?: string[] | undefined;
  focusedUnitId?: string | undefined;
  mode: TranslatorMode;
  onFocusUnit?: ((unitId: string) => void) | undefined;
  editing: {
    modifyUnit: (unitId: string, unit: UnitEdit) => void;
    reorderUnit?: (unitId: string, targetIndex: number) => void;
    proofreadAllUnits?: (isProofread: boolean) => void;
  } | null;
  onResolveUser: UnitUserResolver;
  enableReadOnly?: boolean | undefined;
  specialCharInsertRequest?: SpecialCharInsertRequest | undefined;
  specialCharsBar?: SpecialCharsBarController | undefined;
  onSpecialCharUse?: ((char: string) => void) | undefined;
  onSpecialCharInserted?: ((requestId: number, char: string) => void) | undefined;
};

function activateUnitIndex(
  targetUnitId: string,
  units: UnitInfo[],
  canToggleBubble: boolean,
  onModifyUnit: ((unitId: string, unit: UnitEdit) => void) | undefined,
  onFocusUnit: UnitListProps["onFocusUnit"],
): void {
  const targetUnit = units.find((unit) => unitId(unit) === targetUnitId);
  if (canToggleBubble && targetUnit) {
    onModifyUnit?.(targetUnitId, { isBubble: !unitIsBubble(targetUnit) });
    return;
  }
  onFocusUnit?.(targetUnitId);
}

function proofreadAllUnits(options: {
  units: UnitInfo[];
  readOnly: boolean;
  onProofreadAllUnits: ((isProofread: boolean) => void) | undefined;
  isAllUnitsProofread: boolean;
  showToast: ReturnType<typeof useToastStore.getState>["showToast"];
}): void {
  const { units, readOnly, onProofreadAllUnits, isAllUnitsProofread, showToast } = options;
  if (readOnly || !onProofreadAllUnits || units.length === 0) return;
  onProofreadAllUnits(!isAllUnitsProofread);
  showToast(isAllUnitsProofread ? "已取消全部校对" : "全部校对已确认", "success");
}

function useFocusedUnitScroll(
  listRef: RefObject<HTMLDivElement | null>,
  focusedUnitId: string | undefined,
): void {
  useEffect(() => {
    if (!(focusedUnitId && listRef.current)) return;
    const focusedElement = listRef.current.querySelector(
      `[data-unit-id="${CSS.escape(focusedUnitId)}"]`,
    );
    focusedElement?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [focusedUnitId, listRef]);
}

export function UnitList({
  ItemComponent,
  annotations,
  isAnnotationEditingEnabled = false,
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
}: UnitListProps & { ItemComponent: UnitItemComponent }): JSX.Element {
  const onModifyUnit = editing?.modifyUnit;
  const onReorderUnit = editing?.reorderUnit;
  const readOnly = enableReadOnly || editing === null || mode === "readOnly";
  const listRef = useRef<HTMLDivElement>(null);
  useFocusedUnitScroll(listRef, focusedUnitId);
  const canReorder = !readOnly && onReorderUnit !== undefined;
  const canToggleBubble = !readOnly && onModifyUnit !== undefined;
  const activateIndex = useCommittedCallback((targetUnitId: string): void => {
    activateUnitIndex(targetUnitId, units, canToggleBubble, onModifyUnit, onFocusUnit);
  });
  const { orderedUnits, draggingUnitId, handleIndexPointerDown } = useUnitReorder({
    units,
    listRef,
    enabled: canReorder,
    onActivateUnit: activateIndex,
    onReorderUnit,
  });
  const getContributor = useUnitContributors({ units, onResolveUser });

  const showToast = useToastStore((state) => state.showToast);
  const isAllUnitsProofread = units.length > 0 && units.every(unitIsProofread);

  const proofreadAll = (): void => {
    proofreadAllUnits({
      units,
      readOnly,
      onProofreadAllUnits: editing?.proofreadAllUnits,
      isAllUnitsProofread,
      showToast,
    });
  };

  return (
    <Tooltip.Provider>
      <div className="flex h-full w-full flex-col overflow-hidden bg-surface-stone-50">
        <div
          ref={listRef}
          className={clsx("min-h-0 flex-1 overflow-y-auto", draggingUnitId && "select-none")}
        >
          {orderedUnits.map((unit) => (
            <UnitListItem
              ItemComponent={ItemComponent}
              key={unitId(unit)}
              annotations={annotations}
              isAnnotationEditingEnabled={isAnnotationEditingEnabled}
              unit={unit}
              hasLocalDraft={pendingUnitIds?.includes(unitId(unit)) ?? false}
              isFocused={focusedUnitId === unitId(unit)}
              onFocusUnit={onFocusUnit}
              activateIndex={activateIndex}
              translator={getContributor(unitTranslatorId(unit))}
              proofreader={getContributor(unitProofreaderId(unit))}
              canToggleBubble={canToggleBubble}
              onModifyUnit={onModifyUnit}
              canReorder={canReorder}
              handleIndexPointerDown={handleIndexPointerDown}
              isDragging={draggingUnitId === unitId(unit)}
              isDragDimmed={draggingUnitId !== null && draggingUnitId !== unitId(unit)}
              readOnly={readOnly}
              specialCharInsertRequest={
                specialCharInsertRequest?.targetUnitId === unitId(unit)
                  ? specialCharInsertRequest
                  : undefined
              }
              specialCharsBar={specialCharsBar}
              onSpecialCharUse={onSpecialCharUse}
              onSpecialCharInserted={onSpecialCharInserted}
            />
          ))}
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
