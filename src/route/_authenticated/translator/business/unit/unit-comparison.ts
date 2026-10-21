import {
  isUnitFlagged,
  type UnitInfo,
  unitSupplementComment,
  unitProofreadText,
  unitTranslatedText,
  unitTranslationComment,
} from "./unit.ts";

export function isUnitSame(rhs: UnitInfo, lhs: UnitInfo): boolean {
  if (rhs.id !== lhs.id) return false;
  if (rhs.xCoord !== lhs.xCoord || rhs.yCoord !== lhs.yCoord) return false;
  if (isUnitFlagged(rhs) !== isUnitFlagged(lhs)) return false;
  if (rhs.isBubble !== lhs.isBubble) return false;
  if (rhs.isProofread !== lhs.isProofread) return false;
  if (rhs.translatorId !== lhs.translatorId) return false;
  if (rhs.proofreaderId !== lhs.proofreaderId) return false;
  if (unitTranslatedText(rhs) !== unitTranslatedText(lhs)) return false;
  if (unitProofreadText(rhs) !== unitProofreadText(lhs)) return false;
  if (unitTranslationComment(rhs) !== unitTranslationComment(lhs)) return false;
  if (unitSupplementComment(rhs) !== unitSupplementComment(lhs)) return false;
  return true;
}
