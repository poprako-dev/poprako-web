import type { RefObject } from "react";
import {
  type UnitInfo,
  unitId,
  unitProofreadText,
} from "@/route/_authenticated/translator/business/unit/unit";
import type { UnitEdit } from "@/route/_authenticated/translator/business/unit/unit-edit";
import type {
  CopyFromTranslationRequest,
  SpecialCharInsertRequest,
} from "@/route/_authenticated/translator/business/unit-list/UnitList";
import { useUnitTextInsertion } from "@/route/_authenticated/translator/business/unit-list/use-unit-text-insertion";
import { useCopyFromTranslation } from "@/route/_authenticated/translator/business/unit-list/use-copy-from-translation";

type Options = {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  unit: UnitInfo;
  isFocused: boolean;
  enableReadOnly: boolean;
  onModifyUnit: ((unitId: string, updates: UnitEdit) => void) | undefined;
  specialCharInsertRequest: SpecialCharInsertRequest | undefined;
  onSpecialCharInserted: ((requestId: number, char: string) => void) | undefined;
  copyRequest: CopyFromTranslationRequest | undefined;
  onCopyHandled: ((requestId: number) => void) | undefined;
};

/** 校对文本的符号插入与「从初翻复制」共用同一文本框和提交入口。 */
export function useProofreadTextEditing(options: Options): {
  insertChar: (char: string) => void;
  copyFromTranslation: () => void;
} {
  const insertChar = useUnitTextInsertion({
    textareaRef: options.textareaRef,
    unitId: unitId(options.unit),
    text: unitProofreadText(options.unit),
    textField: "proofreadText",
    isFocused: options.isFocused,
    enableReadOnly: options.enableReadOnly,
    onModifyUnit: options.onModifyUnit,
    specialCharInsertRequest: options.specialCharInsertRequest,
    onSpecialCharInserted: options.onSpecialCharInserted,
  });
  const copyFromTranslation = useCopyFromTranslation({
    textareaRef: options.textareaRef,
    unit: options.unit,
    isFocused: options.isFocused,
    enableReadOnly: options.enableReadOnly,
    onModifyUnit: options.onModifyUnit,
    copyRequest: options.copyRequest,
    onCopyHandled: options.onCopyHandled,
  });
  return { insertChar, copyFromTranslation };
}
