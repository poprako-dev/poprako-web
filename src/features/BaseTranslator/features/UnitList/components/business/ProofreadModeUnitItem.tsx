import { useEffect, useRef } from "react";
import clsx from "clsx";
import { Check, Copy, Eraser, X } from "lucide-react";
import type { Unit } from "@/types/unit";
import { unitIsProved, unitProvedText, unitTranslatedText } from "@/types/unit";
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
  const hasTranslatedText = !!unitTranslatedText(unit);

  useEffect(() => {
    if (isFocused && proofRef.current) {
      const len = proofRef.current.value.length;
      proofRef.current.focus();
      proofRef.current.setSelectionRange(len, len);
    } else if (
      !isFocused &&
      proofRef.current &&
      document.activeElement === proofRef.current
    ) {
      proofRef.current.blur();
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
        <div className="flex items-start gap-1">
          <AutoResizeTextarea
            value={unit.translatedText}
            readOnly
            onChange={() => {}}
            placeholder="无翻译内容"
            className={clsx(
              "flex-1 text-[15px] cursor-default leading-relaxed",
              hasProvedText
                ? "text-gray-400"
                : isFocused
                  ? "text-gray-900 font-medium"
                  : "text-gray-700",
            )}
          />
          <button
            title={unitIsProved(unit) ? "取消校对" : "确认校对"}
            onClick={() =>
              onModifyUnit?.(unit.id, { proved: !unitIsProved(unit) })
            }
            className={clsx(
              "shrink-0 mt-0.5 p-0.5 rounded",
              "border border-gray-300",
              unitIsProved(unit)
                ? "text-gray-400 hover:text-gray-500 hover:border-gray-400"
                : "text-gray-400 hover:text-green-500 hover:border-green-300",
              "transition-colors",
            )}
          >
            {unitIsProved(unit) ? <X size={13} /> : <Check size={13} />}
          </button>
        </div>

        {/* 校对框：仅在聚焦或已有校对内容时显示 */}
        {(isFocused || hasProvedText) && (
          <>
            {unit.translatedText && hasProvedText && (
              <div className="w-12 h-px bg-gray-200" />
            )}
            <div className="flex items-start gap-1">
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
                className={clsx(
                  "flex-1 text-[15px] leading-relaxed",
                  isFocused ? "text-gray-900 font-medium" : "text-gray-700",
                )}
              />
              {!hasProvedText && hasTranslatedText && (
                <button
                  title="从初翻复制"
                  onClick={() => {
                    const text = unitTranslatedText(unit);
                    if (text) {
                      onModifyUnit?.(unit.id, {
                        provedText: text,
                        proved: true,
                      });
                    }
                  }}
                  className={clsx(
                    "shrink-0 mt-0.5 p-0.5 rounded",
                    "border border-gray-300",
                    "text-gray-400 hover:text-sky-400 hover:border-sky-300",
                    "transition-colors",
                  )}
                >
                  <Copy size={13} />
                </button>
              )}
              {hasProvedText && (
                <button
                  title="清空校对内容"
                  onClick={() =>
                    onModifyUnit?.(unit.id, {
                      provedText: undefined,
                      proved: false,
                    })
                  }
                  className={clsx(
                    "shrink-0 mt-0.5 p-0.5 rounded",
                    "border border-gray-300",
                    "text-gray-400 hover:text-rose-400 hover:border-rose-300",
                    "transition-colors",
                  )}
                >
                  <Eraser size={13} />
                </button>
              )}
            </div>
            {isFocused && <SpecialCharsBar onInsert={insertChar} />}
          </>
        )}
      </div>
    </BaseUnitItem>
  );
}
