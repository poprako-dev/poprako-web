import { useEffect, useRef } from "react";
import clsx from "clsx";
import { Check, Copy, Eraser, X } from "lucide-react";
import {
  unitId,
  unitIsProofread,
  unitProofreadText,
  unitTranslatedText,
  type UnitInfo,
  type UnitEdit,
} from "@/types/unit";
import BaseUnitItem from "./BaseUnitItem";
import AutoResizeTextarea from "./AutoResizeTextarea";
import SpecialCharsBar from "./SpecialCharsBar";

type Props = {
  unit: UnitInfo;
  isFocused: boolean;
  onSelect?: (unitId: string) => void;
  onModifyUnit?: (unitId: string, updates: UnitEdit) => void;
  dataUnitId?: string;
  enableReadOnly?: boolean;
};

export default function ProofreadModeUnitItem({
  unit,
  isFocused,
  onSelect,
  onModifyUnit,
  dataUnitId,
  enableReadOnly = false,
}: Props) {
  const proofRef = useRef<HTMLTextAreaElement>(null);
  const hasProofreadText = !!unitProofreadText(unit);
  const hasTranslatedText = !!unitTranslatedText(unit);

  useEffect(() => {
    if (isFocused && proofRef.current) {
      if (document.activeElement !== proofRef.current) {
        const len = proofRef.current.value.length;
        proofRef.current.focus({ preventScroll: true });
        proofRef.current.setSelectionRange(len, len);
      }
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
    onModifyUnit?.(unitId(unit), {
      proofreadText: next,
      isProofread: next.trim().length > 0,
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
      onModifyUnit={onModifyUnit}
      isCompleted={unitIsProofread(unit)}
      dataUnitId={dataUnitId}
    >
      <div className="flex flex-col gap-1">
        {/* 初翻文本（只读展示） */}
        <div className="flex items-start gap-1">
          <AutoResizeTextarea
            value={unitTranslatedText(unit) ?? undefined}
            readOnly
            onChange={() => {}}
            onFocus={() => onSelect?.(unitId(unit))}
            placeholder="无翻译内容"
            className={clsx(
              "flex-1 text-[15px] cursor-default leading-relaxed",
              hasProofreadText
                ? "text-gray-400"
                : isFocused
                  ? "text-gray-900 font-medium"
                  : "text-gray-700",
            )}
          />
          {!enableReadOnly && (
            <button
              title={unitIsProofread(unit) ? "取消校对" : "确认校对"}
              onClick={() =>
                onModifyUnit?.(unitId(unit), {
                  isProofread: !unitIsProofread(unit),
                })
              }
              className={clsx(
                "shrink-0 mt-0.5 p-0.5 rounded",
                "border border-gray-300",
                unitIsProofread(unit)
                  ? "text-gray-400 hover:text-gray-500 hover:border-gray-400"
                  : "text-gray-400 hover:text-green-500 hover:border-green-300",
                "transition-colors",
              )}
            >
              {unitIsProofread(unit) ? <X size={13} /> : <Check size={13} />}
            </button>
          )}
        </div>

        {/* 校对框：仅在聚焦或已有校对内容时显示；只读模式下有校对内容就始终显示 */}
        {(enableReadOnly ? hasProofreadText : isFocused || hasProofreadText) && (
          <>
            {unitTranslatedText(unit) && hasProofreadText && (
              <div className="w-12 h-px bg-gray-200" />
            )}
            <div className="flex items-start gap-1">
              <AutoResizeTextarea
                ref={proofRef}
                value={unitProofreadText(unit) ?? undefined}
                onChange={(val) =>
                  onModifyUnit?.(unitId(unit), {
                    proofreadText: val,
                    isProofread: val.trim().length > 0,
                  })
                }
                onFocus={() => onSelect?.(unitId(unit))}
                placeholder="输入校对..."
                readOnly={enableReadOnly}
                className={clsx(
                  "flex-1 text-[15px] leading-relaxed",
                  isFocused ? "text-gray-900 font-medium" : "text-gray-700",
                )}
              />
              {!enableReadOnly && !hasProofreadText && hasTranslatedText && (
                <button
                  title="从初翻复制"
                  onClick={() => {
                    const text = unitTranslatedText(unit);
                    if (text) {
                      onModifyUnit?.(unitId(unit), {
                        proofreadText: text,
                        isProofread: true,
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
              {!enableReadOnly && hasProofreadText && (
                <button
                  title="清空校对内容"
                  onClick={() =>
                    onModifyUnit?.(unitId(unit), {
                      proofreadText: undefined,
                      isProofread: false,
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
            {isFocused && !enableReadOnly && <SpecialCharsBar onInsert={insertChar} />}
          </>
        )}
      </div>
    </BaseUnitItem>
  );
}
