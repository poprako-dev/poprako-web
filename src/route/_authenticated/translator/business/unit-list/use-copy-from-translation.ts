import { useCallback, useEffect, useRef } from "react";
import type { RefObject } from "react";
import {
  type UnitInfo,
  unitId,
  unitProofreadText,
  unitTranslatedText,
} from "@/route/_authenticated/translator/business/unit/unit";
import type { UnitEdit } from "@/route/_authenticated/translator/business/unit/unit-edit";
import type { CopyFromTranslationRequest } from "@/route/_authenticated/translator/business/unit-list/UnitList";

type Options = {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  unit: UnitInfo;
  isFocused: boolean;
  enableReadOnly: boolean;
  onModifyUnit: ((unitId: string, updates: UnitEdit) => void) | undefined;
  copyRequest: CopyFromTranslationRequest | undefined;
  onCopyHandled: ((requestId: number) => void) | undefined;
};

export function useCopyFromTranslation({
  textareaRef,
  unit,
  isFocused,
  enableReadOnly,
  onModifyUnit,
  copyRequest,
  onCopyHandled,
}: Options): () => void {
  const pendingTextRef = useRef<string | null>(null);
  const lastRequestIdRef = useRef<number | undefined>(undefined);

  const copyFromTranslation = useCallback((): void => {
    const text = unitTranslatedText(unit);
    if (!text || enableReadOnly || !isFocused || !onModifyUnit) return;
    if (unitProofreadText(unit) !== null) return;
    pendingTextRef.current = text;
    // 校对文本与校对状态完全独立：复制文本不得切换 isProofread。
    onModifyUnit(unitId(unit), { proofreadText: text });
  }, [enableReadOnly, isFocused, onModifyUnit, unit]);

  // 受控值随提交流入文本框后，再把光标落到末尾；避免在复制前抢占焦点。
  useEffect(() => {
    const pendingText = pendingTextRef.current;
    const textarea = textareaRef.current;
    if (textarea === null || pendingText === null) return;
    if (textarea.value !== pendingText) return;
    pendingTextRef.current = null;
    const end = pendingText.length;
    textarea.focus({ preventScroll: true });
    textarea.setSelectionRange(end, end);
  });

  useEffect(() => {
    if (!isFocused || enableReadOnly || copyRequest === undefined) return;
    if (copyRequest.targetUnitId !== unitId(unit)) return;
    if (copyRequest.id === lastRequestIdRef.current) return;
    lastRequestIdRef.current = copyRequest.id;
    copyFromTranslation();
    onCopyHandled?.(copyRequest.id);
  }, [copyFromTranslation, copyRequest, enableReadOnly, isFocused, onCopyHandled, unit]);

  return copyFromTranslation;
}
