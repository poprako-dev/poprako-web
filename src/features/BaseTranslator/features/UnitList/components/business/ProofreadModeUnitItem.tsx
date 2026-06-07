import { useEffect, useRef } from "react";
import clsx from "clsx";
import { Check, Copy, X } from "lucide-react";
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

export default function ProofreadModeUnitItem({
  unit,
  isFocused,
  onSelect,
  onModifyUnit,
  dataUnitId,
  enableReadOnly = false,
  specialCharInsertRequest,
  onSpecialCharUse,
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
      <div className="flex flex-col">
        {/* 初翻文本（只读展示） */}
        <div className="flex items-center gap-1">
          <AutoResizeTextarea
            value={unitTranslatedText(unit) ?? undefined}
            readOnly
            onChange={() => {}}
            onFocus={() => onSelect?.(unitId(unit))}
            placeholder="无翻译内容"
            className={clsx(
              "flex-1 text-base cursor-default leading-relaxed",
              hasProofreadText
                ? "text-gray-400"
                : isFocused
                  ? "text-gray-900 font-medium"
                  : "text-gray-700",
            )}
          />
          <div className="shrink-0 w-7 h-7 p-1 rounded flex items-center justify-center">
            <div
              className={clsx(
                "w-2 h-2 rounded-full",
                unitIsProofread(unit) ? "bg-[var(--color-green-500)]" : "bg-gray-300",
              )}
            />
          </div>
        </div>

        {/* 校对框：仅在聚焦或已有校对内容时显示；只读模式下有校对内容就始终显示 */}
        {(enableReadOnly
          ? hasProofreadText
          : isFocused || hasProofreadText) && (
          <>
            <div className="h-[1.5px] bg-gray-300 my-1 mr-10" />
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
                  "flex-1 text-base leading-relaxed",
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
                    "shrink-0 p-1 rounded",
                    "text-gray-400 hover:text-green-600",
                    "transition-colors",
                  )}
                >
                  <Copy size={20} strokeWidth={2} />
                </button>
              )}
              {!enableReadOnly && isFocused && (
                <button
                  title={unitIsProofread(unit) ? "取消校对" : "确认校对"}
                  onClick={() =>
                    onModifyUnit?.(unitId(unit), {
                      isProofread: !unitIsProofread(unit),
                    })
                  }
                  className={clsx(
                    "shrink-0 p-1 rounded",
                    unitIsProofread(unit)
                      ? "text-gray-400 hover:text-red-500"
                      : "text-gray-400 hover:text-green-600",
                    "transition-colors",
                  )}
                >
                  {unitIsProofread(unit) ? <X size={20} strokeWidth={2} /> : <Check size={20} strokeWidth={2} />}
                </button>
              )}
            </div>
            {isFocused && !enableReadOnly && (
              <>
                <div className="h-px bg-gray-200 my-1 mr-10" />
                <SpecialCharsBar
                  onInsert={insertChar}
                  onUseChar={onSpecialCharUse}
                />
              </>
            )}
          </>
        )}
      </div>
    </BaseUnitItem>
  );
}
