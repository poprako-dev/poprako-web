import type { JSX } from "react/jsx-runtime";
import { type PointerEvent as ReactPointerEvent, useCallback, useEffect, useRef } from "react";
import clsx from "clsx";
import { Check, Copy, X } from "lucide-react";
import {
  isUnitFlagged,
  unitId,
  type UnitInfo,
  unitIsProofread,
  unitProofreadText,
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

export function ProofreadModeUnitItem({
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
  const proofRef = useRef<HTMLTextAreaElement>(null);
  const lastInsertedRequestIdRef = useRef<number | undefined>(undefined);
  const hasProofreadText = Boolean(unitProofreadText(unit));
  const hasTranslatedText = Boolean(unitTranslatedText(unit));
  const isShowProofreadField = enableReadOnly ? hasProofreadText : isFocused || hasProofreadText;
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
    } else if (!isFocused && proofRef.current && document.activeElement === proofRef.current) {
      proofRef.current.blur();
    }
  }, [isFocused]);

  const insertChar = useCallback(
    (char: string): void => {
      const textarea = proofRef.current;
      if (!textarea || enableReadOnly || !isFocused || !onModifyUnit) return;
      const previousActiveElement = document.activeElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = unitProofreadText(unit) ?? "";
      const next = text.slice(0, Math.max(0, start)) + char + text.slice(Math.max(0, end));
      // 校对文本与校对状态完全独立：输入文本不得切换 isProofread。
      onModifyUnit(unitId(unit), {
        proofreadText: next,
      });
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
      contributors={contributors}
      dataUnitId={dataUnitId}
    >
      <div className="flex flex-col">
        {/* 初翻文本（只读展示） */}
        <div className="flex items-start gap-1">
          <div data-unit-contributor-trigger className="min-w-0 flex-1">
            <AutoResizeTextarea
              value={unitTranslatedText(unit) ?? ""}
              readOnly
              onChange={() => undefined}
              onFocus={() => onSelect?.(unitId(unit))}
              placeholder="无翻译内容"
              className={clsx(
                "cursor-default text-base font-normal leading-relaxed placeholder:text-ink-gray-300",
                hasProofreadText
                  ? "text-ink-gray-400"
                  : isFocused
                    ? "text-ink-gray-900"
                    : "text-ink-gray-700",
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
              role={hasLocalDraft ? "img" : undefined}
              aria-label={hasLocalDraft ? "有未保存草稿" : undefined}
              title={hasLocalDraft ? "有未保存草稿" : undefined}
              className={clsx(
                "w-2 h-2 rounded-full",
                hasLocalDraft && "shadow-[inset_0_0_0_1.5px_var(--color-ink-orange-400)]",
                unitIsProofread(unit) ? "bg-[var(--brand-leaf)]" : "bg-surface-gray-200",
              )}
            />
          </div>
        </div>

        {/* 校对框仅在聚焦或已有内容时显示。 */}
        {/* 只读模式下，有校对内容就始终显示。 */}
        {isShowProofreadField && (
          <>
            <div className="h-[1.5px] bg-surface-gray-300 my-1 mr-10" />
            <div className="flex items-start gap-1">
              <div data-unit-contributor-trigger className="min-w-0 flex-1">
                <AutoResizeTextarea
                  ref={proofRef}
                  value={unitProofreadText(unit) ?? ""}
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
                    "text-base font-normal leading-relaxed placeholder:text-ink-gray-300",
                    isFocused ? "text-ink-gray-900" : "text-ink-gray-700",
                  )}
                />
              </div>
              <div className="size-7 shrink-0">
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
                      "text-ink-gray-400 hover:text-ink-green-600",
                      "transition-colors",
                    )}
                  >
                    <Copy size={20} strokeWidth={2} />
                  </button>
                )}
              </div>
              <div className="size-7 shrink-0">
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
                        ? "text-ink-gray-400 hover:text-ink-red-500"
                        : "text-ink-gray-400 hover:text-ink-green-600",
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
          </>
        )}
      </div>
    </BaseUnitItem>
  );
}
