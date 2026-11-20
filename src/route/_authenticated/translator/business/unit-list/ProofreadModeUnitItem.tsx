import type { JSX } from "react/jsx-runtime";
import { useRef } from "react";
import clsx from "clsx";
import { Check, Copy, X } from "lucide-react";
import { UnitProgressIndicator } from "./UnitProgressIndicator";
import {
  isUnitFlagged,
  unitId,
  unitIsProofread,
  unitProofreadText,
  unitTranslatedText,
} from "@/route/_authenticated/translator/business/unit/unit";
import { BaseUnitItem } from "@/route/_authenticated/translator/business/unit-list/BaseUnitItem";
import { UnitFlagButton } from "@/route/_authenticated/translator/business/unit-list/UnitFlagButton";
import { AutoResizeTextarea } from "@/route/_authenticated/translator/business/unit-list/AutoResizeTextarea";
import { SpecialCharsBar } from "@/route/_authenticated/translator/business/unit-list/SpecialCharsBar";
import type { UnitItemProps } from "@/route/_authenticated/translator/business/unit-list/unit-item-props";
import { useFocusTextArea } from "@/route/_authenticated/translator/business/unit-list/use-unit-text-insertion";
import { useProofreadTextEditing } from "@/route/_authenticated/translator/business/unit-list/use-proofread-text-editing";
import type { UnitContributor } from "@/route/_authenticated/translator/business/unit-list/UnitContributorTooltip";

type Props = UnitItemProps;

function buildContributors(
  translator: UnitItemProps["translator"],
  proofreader: UnitItemProps["proofreader"],
  isShowProofreadField: boolean,
): UnitContributor[] {
  return [
    ...(translator ? [{ role: "translator" as const, user: translator }] : []),
    ...(isShowProofreadField && proofreader
      ? [{ role: "proofreader" as const, user: proofreader }]
      : []),
  ];
}

export function ProofreadModeUnitItem({
  annotationEditor,
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
  copyFromTranslationRequest,
  specialCharsBar,
  onSpecialCharUse,
  onSpecialCharInserted,
  onCopyFromTranslationHandled,
}: Props): JSX.Element {
  const proofRef = useRef<HTMLTextAreaElement>(null);
  const hasProofreadText = Boolean(unitProofreadText(unit));
  const hasTranslatedText = Boolean(unitTranslatedText(unit));
  const isShowProofreadField = enableReadOnly ? hasProofreadText : isFocused || hasProofreadText;
  const contributors = buildContributors(translator, proofreader, isShowProofreadField);

  useFocusTextArea(proofRef, isFocused);

  const { insertChar, copyFromTranslation } = useProofreadTextEditing({
    textareaRef: proofRef,
    unit,
    isFocused,
    enableReadOnly,
    onModifyUnit,
    specialCharInsertRequest,
    onSpecialCharInserted,
    copyRequest: copyFromTranslationRequest,
    onCopyHandled: onCopyFromTranslationHandled,
  });

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
                "cursor-default text-base font-normal leading-relaxed placeholder:text-text-muted-neutral/20",
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
          <UnitProgressIndicator complete={unitIsProofread(unit)} hasLocalDraft={hasLocalDraft} />
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
                    "text-base font-normal leading-relaxed placeholder:text-text-muted-neutral/20",
                    isFocused ? "text-ink-gray-900" : "text-ink-gray-700",
                  )}
                />
              </div>
              <div className="size-7 shrink-0">
                {!enableReadOnly && !hasProofreadText && hasTranslatedText && (
                  <button
                    type="button"
                    title="从初翻复制"
                    onClick={copyFromTranslation}
                    className={clsx(
                      "shrink-0 p-1 rounded",
                      "text-text-muted-neutral hover:text-text-green",
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
                        ? "text-text-muted-neutral hover:text-text-danger"
                        : "text-text-muted-neutral hover:text-text-green",
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
        {annotationEditor}
      </div>
    </BaseUnitItem>
  );
}
