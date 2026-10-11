import { useCallback, useEffect, useRef } from "react";
import type { RefObject } from "react";
import type { UnitEdit } from "@/route/_authenticated/translator/business/unit/unit-edit";
import type { SpecialCharInsertRequest } from "@/route/_authenticated/translator/business/unit-list/UnitList";

type TextField = "translatedText" | "proofreadText";

type Options = {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  unitId: string;
  text: string | null;
  textField: TextField;
  isFocused: boolean;
  enableReadOnly: boolean;
  onModifyUnit: ((unitId: string, updates: UnitEdit) => void) | undefined;
  specialCharInsertRequest: SpecialCharInsertRequest | undefined;
  onSpecialCharInserted: ((requestId: number, char: string) => void) | undefined;
};

export function useFocusTextArea(
  textareaRef: RefObject<HTMLTextAreaElement | null>,
  isFocused: boolean,
): void {
  useEffect(() => {
    const textarea = textareaRef.current;
    if (isFocused && textarea) {
      if (document.activeElement !== textarea) {
        const length = textarea.value.length;
        textarea.focus({ preventScroll: true });
        textarea.setSelectionRange(length, length);
      }
    } else if (!isFocused && textarea && document.activeElement === textarea) {
      textarea.blur();
    }
  }, [isFocused, textareaRef]);
}

function insertAtSelection(
  textarea: HTMLTextAreaElement,
  text: string,
  char: string,
  unitId: string,
  textField: TextField,
  onModifyUnit: NonNullable<Options["onModifyUnit"]>,
): void {
  const previousActiveElement = document.activeElement;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const next = text.slice(0, Math.max(0, start)) + char + text.slice(Math.max(0, end));
  // 校对文本与校对状态完全独立：输入文本不得切换 isProofread。
  const update: UnitEdit =
    textField === "translatedText" ? { translatedText: next } : { proofreadText: next };
  onModifyUnit(unitId, update);
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
}

export function useUnitTextInsertion({
  textareaRef,
  unitId,
  text,
  textField,
  isFocused,
  enableReadOnly,
  onModifyUnit,
  specialCharInsertRequest,
  onSpecialCharInserted,
}: Options): (char: string) => void {
  const lastInsertedRequestIdRef = useRef<number | undefined>(undefined);
  const insertChar = useCallback(
    (char: string): void => {
      const textarea = textareaRef.current;
      if (!textarea || enableReadOnly || !isFocused || !onModifyUnit) return;
      insertAtSelection(textarea, text ?? "", char, unitId, textField, onModifyUnit);
    },
    [enableReadOnly, isFocused, onModifyUnit, text, textField, textareaRef, unitId],
  );

  useEffect(() => {
    const request = specialCharInsertRequest;
    if (
      !isFocused ||
      enableReadOnly ||
      request?.targetUnitId !== unitId ||
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
    unitId,
  ]);

  return insertChar;
}
