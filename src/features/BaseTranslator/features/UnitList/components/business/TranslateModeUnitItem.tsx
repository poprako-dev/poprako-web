import { useEffect, useRef } from "react";
import {
  unitId,
  unitTranslatedText,
  type UnitInfo,
  type UnitEdit,
} from "@/types/unit";
import BaseUnitItem from "./BaseUnitItem";
import AutoResizeTextarea from "./AutoResizeTextarea";
import SpecialCharsBar from "./SpecialCharsBar";
import type { SpecialCharInsertRequest } from "./UnitList";

type Props = {
  unit: UnitInfo;
  isFocused: boolean;
  onSelect?: (unitId: string) => void;
  onModifyUnit?: (unitId: string, updates: UnitEdit) => void;
  dataUnitId?: string;
  enableReadOnly?: boolean;
  specialCharInsertRequest?: SpecialCharInsertRequest;
  onSpecialCharUse?: (char: string) => void;
};

export default function TranslateModeUnitItem({
  unit,
  isFocused,
  onSelect,
  onModifyUnit,
  dataUnitId,
  enableReadOnly = false,
  specialCharInsertRequest,
  onSpecialCharUse,
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
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const next =
      textarea.value.substring(0, start) + char + textarea.value.substring(end);
    onModifyUnit?.(unitId(unit), { translatedText: next });
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + char.length;
      textarea.focus();
    }, 0);
  }

  useEffect(() => {
    if (!isFocused || enableReadOnly || !specialCharInsertRequest) return;
    insertChar(specialCharInsertRequest.char);
    onSpecialCharUse?.(specialCharInsertRequest.char);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specialCharInsertRequest?.id]);

  return (
    <BaseUnitItem
      unit={unit}
      isFocused={isFocused}
      onSelect={onSelect}
      onModifyUnit={onModifyUnit}
      dataUnitId={dataUnitId}
    >
      <AutoResizeTextarea
        ref={inputRef}
        value={unitTranslatedText(unit) ?? undefined}
        onChange={(val) =>
          onModifyUnit?.(unitId(unit), { translatedText: val })
        }
        onFocus={() => onSelect?.(unitId(unit))}
        placeholder="点击输入翻译..."
        readOnly={enableReadOnly}
        className={`text-base leading-relaxed ${
          isFocused ? "text-gray-900 font-medium" : "text-gray-700"
        }`}
      />
      {isFocused && !enableReadOnly && (
        <>
          <div className="h-px bg-gray-200 my-1 mr-10" />
          <SpecialCharsBar onInsert={insertChar} onUseChar={onSpecialCharUse} />
        </>
      )}
    </BaseUnitItem>
  );
}
