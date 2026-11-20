import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import type { UnitInfo } from "@/route/_authenticated/translator/business/unit/unit";
import type { UnitEdit } from "@/route/_authenticated/translator/business/unit/unit-edit";
import type { UserInfo } from "@/route/business/identity/user";
import type { SpecialCharsBarController } from "@/route/_authenticated/translator/business/preference/use-detachable-special-chars-bar";
import type {
  CopyFromTranslationRequest,
  SpecialCharInsertRequest,
} from "@/route/_authenticated/translator/business/unit-list/UnitList";

/** 翻译模式与校对模式单元项共用的 props 契约。 */
export type UnitItemProps = {
  annotationEditor?: ReactNode;
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
  copyFromTranslationRequest?: CopyFromTranslationRequest | undefined;
  specialCharsBar?: SpecialCharsBarController | undefined;
  onSpecialCharUse?: ((char: string) => void) | undefined;
  onSpecialCharInserted?: ((requestId: number, char: string) => void) | undefined;
  onCopyFromTranslationHandled?: ((requestId: number) => void) | undefined;
};
