import { useEffect, useRef } from "react";
import type { Unit } from "@/types/unit";
import { unitIsProved, unitProvedText } from "@/types/unit";
import BaseUnitItem from "./BaseUnitItem";
import AutoResizeTextarea from "./AutoResizeTextarea";
import SpecialCharsBar from "./SpecialCharsBar";

type Props = {
  unit: Unit;
  isFocused: boolean;
  onSelect?: (unitId: string) => void;
  onModifyUnit?: (unitId: string, updates: Partial<Unit>) => void;
};

export default function ProofreadModeUnitItem({
  unit,
  isFocused,
  onSelect,
  onModifyUnit,
}: Props) {
  const proofRef = useRef<HTMLTextAreaElement>(null);
  const hasProvedText = !!unitProvedText(unit);

  useEffect(() => {
    if (isFocused && proofRef.current) {
      const len = proofRef.current.value.length;
      proofRef.current.focus();
      proofRef.current.setSelectionRange(len, len);
    }
  }, [isFocused]);

  function insertChar(char: string) {
    const textarea = proofRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const next =
      textarea.value.substring(0, start) + char + textarea.value.substring(end);
    onModifyUnit?.(unit.id, {
      provedText: next,
      proved: next.trim().length > 0,
    });
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
      isCompleted={unitIsProved(unit)}
    >
      <div className="flex flex-col gap-1">
        {/* 初翻文本（只读展示） */}
        <AutoResizeTextarea
          value={unit.translatedText}
          readOnly
          onChange={() => {}}
          placeholder="无翻译内容"
          className={`text-[15px] cursor-default leading-relaxed ${
            hasProvedText
              ? "text-gray-400"
              : isFocused
                ? "text-gray-900 font-medium"
                : "text-gray-700"
          }`}
        />

        {/* 校对框：仅在聚焦或已有校对内容时显示 */}
        {(isFocused || hasProvedText) && (
          <>
            {unit.translatedText && hasProvedText && (
              <div className="w-12 h-px bg-gray-200" />
            )}
            <AutoResizeTextarea
              ref={proofRef}
              value={unit.provedText}
              onChange={(val) =>
                onModifyUnit?.(unit.id, {
                  provedText: val,
                  proved: val.trim().length > 0,
                })
              }
              placeholder="输入校对..."
              className={`text-[15px] leading-relaxed ${
                isFocused ? "text-gray-900 font-medium" : "text-gray-700"
              }`}
            />
            {isFocused && <SpecialCharsBar onInsert={insertChar} />}
          </>
        )}
      </div>
    </BaseUnitItem>
  );
}
