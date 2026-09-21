/* eslint-disable @eslint-react/exhaustive-deps, unicorn/no-useless-undefined */
import {
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from "react";
import clsx from "clsx";
import { Check, Copy, X } from "lucide-react";
import {
  unitId,
  isUnitFlagged,
  unitIsProofread,
  unitProofreadText,
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

export default function ProofreadModeUnitItem({
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
  onSpecialCharUse,
  onSpecialCharInserted,
}: Props) {
  const proofRef = useRef<HTMLTextAreaElement>(null);
  const hasProofreadText = Boolean(unitProofreadText(unit));
  const hasTranslatedText = Boolean(unitTranslatedText(unit));
  const isShowProofreadField = enableReadOnly
    ? hasProofreadText
    : isFocused || hasProofreadText;
  const contributors = [
    ...(translator ? [{ role: "translator" as const, user: translator }] : []),
    ...(isShowProofreadField && proofreader
      ? [{ role: "proofreader" as const, user: proofreader }]
      : []),
  ];

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
    if (!textarea) {return;}
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = unitProofreadText(unit) ?? "";
    const next =
      text.slice(0, Math.max(0, start)) + char + text.slice(Math.max(0, end));
    // 校对文本与校对状态完全独立：输入文本不得切换 isProofread。
    onModifyUnit?.(unitId(unit), {
      proofreadText: next,
    });
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
      contributors={contributors}
      dataUnitId={dataUnitId}
    >
      <div className="flex flex-col">
        {/* 初翻文本（只读展示） */}
        <div className="flex items-start gap-1">
          <div data-unit-contributor-trigger className="min-w-0 flex-1">
            <AutoResizeTextarea
              value={unitTranslatedText(unit) ?? undefined}
              readOnly
              onChange={() => undefined}
              onFocus={() => onSelect?.(unitId(unit))}
              placeholder="无翻译内容"
              className={clsx(
                "cursor-default text-base leading-relaxed placeholder:text-gray-300",
                hasProofreadText
                  ? "text-gray-400"
                  : (isFocused
                    ? "text-gray-900 font-medium"
                    : "text-gray-700"),
              )}
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
                unitIsProofread(unit)
                  ? "bg-[var(--color-green-500)]"
                  : "bg-gray-200",
              )}
            />
          </div>
        </div>

        {/* 校对框仅在聚焦或已有内容时显示。 */}
        {/* 只读模式下，有校对内容就始终显示。 */}
        {isShowProofreadField && (
          <>
            <div className="h-[1.5px] bg-gray-300 my-1 mr-10" />
            <div className="flex items-start gap-1">
              <div data-unit-contributor-trigger className="min-w-0 flex-1">
                <AutoResizeTextarea
                  ref={proofRef}
                  value={unitProofreadText(unit) ?? undefined}
                  onChange={(val) =>
                  onModifyUnit?.(unitId(unit), {
                    // 校对文本与校对状态完全独立：编辑文本不得切换 isProofread。
                    proofreadText: val,
                  })
                  }
                  onFocus={() => onSelect?.(unitId(unit))}
                  placeholder="输入校对..."
                  readOnly={enableReadOnly}
                  className={clsx(
                    "text-base leading-relaxed placeholder:text-gray-300",
                    isFocused ? "text-gray-900 font-medium" : "text-gray-700",
                  )}
                />
              </div>
              {!enableReadOnly && !hasProofreadText && hasTranslatedText && (
                <button
                  type="button"
                  title="从初翻复制"
                  onClick={() => {
                    const text = unitTranslatedText(unit);
                    if (text) {
                      onModifyUnit?.(unitId(unit), {
                        // 校对文本与校对状态完全独立：复制文本不得切换 isProofread。
                        proofreadText: text,
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
                  type="button"
                  title={unitIsProofread(unit) ? "取消校对" : "确认校对"}
                  onClick={() =>
                    // 校对状态与校对文本完全独立：此操作不得修改 proofreadText。
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
                  {unitIsProofread(unit) ? (
                    <X size={20} strokeWidth={2} />
                  ) : (
                    <Check size={20} strokeWidth={2} />
                  )}
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
