/* eslint-disable @eslint-react/exhaustive-deps, @eslint-react/no-unused-props */
import {
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from "react";
import clsx from "clsx";
import {
  unitId,
  isUnitFlagged,
  unitTranslatedText,
  type UnitInfo,
  type UnitEdit,
} from "@/types/unit";
import type { UserInfo } from "@/types/user";
import BaseUnitItem from "./BaseUnitItem";
import UnitFlagButton from "./UnitFlagButton";
import AutoResizeTextarea from "./AutoResizeTextarea";
import SpecialCharsBar from "./SpecialCharsBar";
import type { SpecialCharInsertRequest } from "./UnitList";

interface Props {
  unit: UnitInfo;
  isFocused: boolean;
  onSelect?: ((unitId: string) => void) | undefined;
  onIndexActivate?: ((unitId: string) => void) | undefined;
  canToggleBubble?: boolean | undefined;
  onModifyUnit?: ((unitId: string, updates: UnitEdit) => void) | undefined;
  onIndexPointerDown?: ((
    event: ReactPointerEvent<HTMLButtonElement>,
    unitId: string,
  ) => void) | undefined;
  isDragging?: boolean | undefined;
  isDragDimmed?: boolean | undefined;
  showDropIndicator?: boolean | undefined;
  dataUnitId?: string | undefined;
  enableReadOnly?: boolean | undefined;
  translator?: UserInfo | undefined;
  proofreader?: UserInfo | undefined;
  specialCharInsertRequest?: SpecialCharInsertRequest | undefined;
  onSpecialCharUse?: ((char: string) => void) | undefined;
  onSpecialCharInserted?: ((requestId: number, char: string) => void) | undefined;
}

export default function TranslateModeUnitItem({
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
  specialCharInsertRequest,
  onSpecialCharUse,
  onSpecialCharInserted,
}: Props) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isFocused && inputRef.current) {
      if (document.activeElement !== inputRef.current) {
        const len = inputRef.current.value.length;
        inputRef.current.focus({ preventScroll: true });
        inputRef.current.setSelectionRange(len, len);
      }
    } else if (
      !isFocused &&
      inputRef.current &&
      document.activeElement === inputRef.current
    ) {
      inputRef.current.blur();
    }
  }, [isFocused]);

  function insertChar(char: string) {
    const textarea = inputRef.current;
    if (!textarea) {return;}
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = unitTranslatedText(unit) ?? "";
    const next =
      text.slice(0, Math.max(0, start)) + char + text.slice(Math.max(0, end));
    onModifyUnit?.(unitId(unit), { translatedText: next });
    setTimeout(() => {
      if (document.activeElement !== textarea) {return;}
      textarea.selectionStart = textarea.selectionEnd = start + char.length;
    }, 0);
  }

  useEffect(() => {
    if (
      !isFocused ||
      enableReadOnly ||
      specialCharInsertRequest?.targetUnitId !== unitId(unit)
    ) {
      return;
    }
    insertChar(specialCharInsertRequest.char);
    onSpecialCharInserted?.(
      specialCharInsertRequest.id,
      specialCharInsertRequest.char,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specialCharInsertRequest?.id]);

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
      contributors={translator ? [{ role: "translator", user: translator }] : []}
      dataUnitId={dataUnitId}
    >
      <div className="flex items-start gap-1">
        <div data-unit-contributor-trigger className="min-w-0 flex-1">
          <AutoResizeTextarea
            ref={inputRef}
            value={unitTranslatedText(unit) ?? undefined}
            onChange={(val) =>
              onModifyUnit?.(unitId(unit), { translatedText: val })
            }
            onFocus={() => onSelect?.(unitId(unit))}
            placeholder="点击输入翻译..."
            readOnly={enableReadOnly}
            className={`text-base font-normal leading-relaxed ${
              isFocused ? "text-gray-900" : "text-gray-700"
            } placeholder:text-gray-300`}
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
              unitTranslatedText(unit)
                ? "bg-[var(--color-green-500)]"
                : "bg-gray-200",
            )}
          />
        </div>
      </div>
      {isFocused && !enableReadOnly && (
        <>
          <div className="h-px bg-gray-200 my-1 mr-10" />
          <SpecialCharsBar onInsert={insertChar} onUseChar={onSpecialCharUse} />
        </>
      )}
    </BaseUnitItem>
  );
}
