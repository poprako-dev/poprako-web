import { useEffect, useRef } from "react";
import type { Unit } from "@/types/unit";
import { unitIsTranslated } from "@/types/unit";
import BaseUnitItem from "./BaseUnitItem";
import AutoResizeTextarea from "./AutoResizeTextarea";
import SpecialCharsBar from "./SpecialCharsBar";

type Props = {
  unit: Unit;
  isFocused: boolean;
  onSelect?: (unitId: string) => void;
  onModifyUnit?: (unitId: string, updates: Partial<Unit>) => void;
};

export default function TranslateModeUnitItem({
  unit,
  isFocused,
  onSelect,
  onModifyUnit,
}: Props) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isFocused && inputRef.current) {
      const len = inputRef.current.value.length;
      inputRef.current.focus();
      inputRef.current.setSelectionRange(len, len);
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
    onModifyUnit?.(unit.id, { translatedText: next });
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + char.length;
      textarea.focus();
    }, 0);
  }

  return (
    <BaseUnitItem
      unit={unit}
      isFocused={isFocused}
      onSelect={onSelect}
      isCompleted={unitIsTranslated(unit)}
    >
      <AutoResizeTextarea
        ref={inputRef}
        value={unit.translatedText}
        onChange={(val) => onModifyUnit?.(unit.id, { translatedText: val })}
        placeholder="点击输入翻译..."
        className={`text-[15px] leading-relaxed ${
          isFocused ? "text-gray-900 font-medium" : "text-gray-700"
        }`}
      />
      {isFocused && <SpecialCharsBar onInsert={insertChar} />}
    </BaseUnitItem>
  );
}
