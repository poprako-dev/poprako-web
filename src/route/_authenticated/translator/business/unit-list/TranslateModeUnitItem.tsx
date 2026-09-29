import type { JSX } from "react/jsx-runtime";
import { type PointerEvent as ReactPointerEvent, useCallback, useEffect, useRef } from "react";
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

type Props = {
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
  const lastInsertedRequestIdRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (isFocused && inputRef.current) {
      if (document.activeElement !== inputRef.current) {
        const len = inputRef.current.value.length;
        inputRef.current.focus({ preventScroll: true });
        inputRef.current.setSelectionRange(len, len);
      }
    } else if (!isFocused && inputRef.current && document.activeElement === inputRef.current) {
      inputRef.current.blur();
    }
  }, [isFocused]);

  const insertChar = useCallback(
    (char: string): void => {
      const textarea = inputRef.current;
      if (!textarea || enableReadOnly || !isFocused || !onModifyUnit) return;
      const previousActiveElement = document.activeElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = unitTranslatedText(unit) ?? "";
      const next = text.slice(0, Math.max(0, start)) + char + text.slice(Math.max(0, end));
      onModifyUnit(unitId(unit), { translatedText: next });
      setTimeout(() => {
        if (
          !textarea.isConnected ||
          (document.activeElement !== previousActiveElement && document.activeElement !== textarea)
        ) {
          return;
        }
        textarea.focus({ preventScroll: true });
        textarea.selectionStart = textarea.selectionEnd = start + char.length;
      }, 0);
    },
    [enableReadOnly, isFocused, onModifyUnit, unit],
  );

  useEffect(() => {
    const request = specialCharInsertRequest;
    if (
      !isFocused ||
      enableReadOnly ||
      request?.targetUnitId !== unitId(unit) ||
      request.id === lastInsertedRequestIdRef.current
    ) {
      return;
    }
    lastInsertedRequestIdRef.current = request.id;
    insertChar(request.char);
    onSpecialCharInserted?.(request.id, request.char);
  }, [
    enableReadOnly,
    insertChar,
    isFocused,
    onSpecialCharInserted,
    specialCharInsertRequest,
    unit,
  ]);

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
            } placeholder:text-ink-gray-300`}
          />
        </div>
        <UnitFlagButton
          isFlagged={isUnitFlagged(unit)}
          isDisabled={enableReadOnly || onModifyUnit === undefined}
          onToggle={() => onModifyUnit?.(unitId(unit), { isFlagged: !isUnitFlagged(unit) })}
        />
        <div className="shrink-0 w-7 h-7 p-1 rounded flex items-center justify-center">
          <div
            className={clsx(
              "w-2 h-2 rounded-full",
              unitTranslatedText(unit) ? "bg-[var(--brand-leaf)]" : "bg-surface-gray-200",
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
