import type { JSX } from "react/jsx-runtime";
import { type PointerEvent as ReactPointerEvent, useRef } from "react";
import clsx from "clsx";
import {
  isUnitFlagged,
  unitId,
  type UnitInfo,
  unitTranslatedText,
} from "@/route/_authenticated/translator/business/unit/unit";
import type { UnitEdit } from "@/route/_authenticated/translator/business/unit/unit-edit";
import type { UserInfo } from "@/route/business/identity/user";
import { BaseUnitItem } from "@/route/_authenticated/translator/business/unit-list/BaseUnitItem";
import { UnitFlagButton } from "@/route/_authenticated/translator/business/unit-list/UnitFlagButton";
import { AutoResizeTextarea } from "@/route/_authenticated/translator/business/unit-list/AutoResizeTextarea";
import { SpecialCharsBar } from "@/route/_authenticated/translator/business/unit-list/SpecialCharsBar";
import type { SpecialCharInsertRequest } from "@/route/_authenticated/translator/business/unit-list/UnitList";
import type { SpecialCharsBarController } from "@/route/_authenticated/translator/business/preference/use-detachable-special-chars-bar";
import {
  useFocusTextArea,
  useUnitTextInsertion,
} from "@/route/_authenticated/translator/business/unit-list/use-unit-text-insertion";

type Props = {
  hasLocalDraft?: boolean | undefined;
  unit: UnitInfo;
  isFocused: boolean;
  onSelect?: ((unitId: string) => void) | undefined;
  onIndexActivate?: ((unitId: string) => void) | undefined;
  canToggleBubble?: boolean | undefined;
  onModifyUnit?: ((unitId: string, updates: UnitEdit) => void) | undefined;
  onIndexPointerDown?:
    | ((event: ReactPointerEvent<HTMLButtonElement>, unitId: string) => void)
    | undefined;
  isDragging?: boolean | undefined;
  isDragDimmed?: boolean | undefined;
  showDropIndicator?: boolean | undefined;
  dataUnitId?: string | undefined;
  enableReadOnly?: boolean | undefined;
  translator?: UserInfo | undefined;
  proofreader?: UserInfo | undefined;
  specialCharInsertRequest?: SpecialCharInsertRequest | undefined;
  specialCharsBar?: SpecialCharsBarController | undefined;
  onSpecialCharUse?: ((char: string) => void) | undefined;
  onSpecialCharInserted?: ((requestId: number, char: string) => void) | undefined;
};

export function TranslateModeUnitItem({
  unit,
  hasLocalDraft,
  isFocused,
  onSelect,
  onIndexActivate,
  canToggleBubble,
  onModifyUnit,
  onIndexPointerDown,
  isDragging,
  isDragDimmed,
  showDropIndicator,
  dataUnitId,
  enableReadOnly = false,
  translator,
  proofreader,
  specialCharInsertRequest,
  specialCharsBar,
  onSpecialCharUse,
  onSpecialCharInserted,
}: Props): JSX.Element {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useFocusTextArea(inputRef, isFocused);

  const insertChar = useUnitTextInsertion({
    textareaRef: inputRef,
    unitId: unitId(unit),
    text: unitTranslatedText(unit),
    textField: "translatedText",
    isFocused,
    enableReadOnly,
    onModifyUnit,
    specialCharInsertRequest,
    onSpecialCharInserted,
  });

  return (
    <BaseUnitItem
      unit={unit}
      isFocused={isFocused}
      onIndexActivate={onIndexActivate}
      canToggleBubble={canToggleBubble}
      onIndexPointerDown={onIndexPointerDown}
      isDragging={isDragging}
      isDragDimmed={isDragDimmed}
      showDropIndicator={showDropIndicator}
      enableReadOnly={enableReadOnly}
      contributors={[
        ...(translator ? [{ role: "translator" as const, user: translator }] : []),
        ...(proofreader ? [{ role: "proofreader" as const, user: proofreader }] : []),
      ]}
      dataUnitId={dataUnitId}
    >
      <div className="flex items-start gap-1">
        <div data-unit-contributor-trigger className="min-w-0 flex-1">
          <AutoResizeTextarea
            ref={inputRef}
            value={unitTranslatedText(unit) ?? ""}
            onChange={(val) => onModifyUnit?.(unitId(unit), { translatedText: val })}
            onFocus={() => onSelect?.(unitId(unit))}
            placeholder="点击输入翻译..."
            readOnly={enableReadOnly}
            className={`text-base font-normal leading-relaxed ${
              isFocused ? "text-ink-gray-900" : "text-ink-gray-700"
            } placeholder:text-text-muted-neutral/20`}
          />
        </div>
        <UnitFlagButton
          isFlagged={isUnitFlagged(unit)}
          isDisabled={enableReadOnly || onModifyUnit === undefined}
          onToggle={() => onModifyUnit?.(unitId(unit), { isFlagged: !isUnitFlagged(unit) })}
        />
        <div className="shrink-0 w-7 h-7 p-1 rounded flex items-center justify-center">
          <div
            role={hasLocalDraft ? "img" : undefined}
            aria-label={hasLocalDraft ? "有未保存草稿" : undefined}
            title={hasLocalDraft ? "有未保存草稿" : undefined}
            className={clsx(
              "size-2.5 rounded-full",
              hasLocalDraft ? "border-[2.5px] border-current" : "bg-current",
              unitTranslatedText(unit)
                ? "text-[var(--brand-leaf)]"
                : "text-[var(--surface-gray-200)]",
            )}
          />
        </div>
      </div>
      {isFocused &&
        !enableReadOnly &&
        (!specialCharsBar?.position || specialCharsBar.placeholderHeight !== null) && (
          <>
            <div className="h-px bg-surface-gray-200 my-1 mr-10" />
            <SpecialCharsBar
              controller={specialCharsBar}
              onInsert={insertChar}
              onUseChar={onSpecialCharUse}
            />
          </>
        )}
    </BaseUnitItem>
  );
}
