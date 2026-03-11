export type Unit = {
  id: string;

  // 均为 0~1 的浮点数
  xCoord: number;
  yCoord: number;

  // 0-based 的页内索引
  index: number;

  // 是否为框内文本，否则是框外文本
  isBubble: boolean;

  translatedText?: string;
  translatorId?: string;
  translatorCommnet?: string;

  isProofread: boolean;
  proofreadText?: string;
  proofreaderId?: string;
  proofreaderComment?: string;
};

export function unitIsTranslated(unit: Unit): boolean {
  return unit.translatedText !== undefined && unit.translatedText != "";
}

export function unitIsProofread(unit: Unit): boolean {
  return unit.isProofread;
}

export function unitFinalText(unit: Unit): string | null {
  if (unit.proofreadText && unit.proofreadText != "") {
    return unit.proofreadText;
  }
  if (unit.translatedText && unit.translatedText != "") {
    return unit.translatedText;
  }

  return null;
}

export function unitTranslatedText(unit: Unit): string | null {
  if (unit.translatedText && unit.translatedText != "") {
    return unit.translatedText;
  }

  return null;
}

export function unitProofreadText(unit: Unit): string | null {
  if (unit.proofreadText && unit.proofreadText != "") {
    return unit.proofreadText;
  }

  return null;
}

export function unitTranslatorComment(unit: Unit): string | null {
  if (unit.translatorCommnet && unit.translatorCommnet != "") {
    return unit.translatorCommnet;
  }

  return null;
}

export function unitProofreaderComment(unit: Unit): string | null {
  if (unit.proofreaderComment && unit.proofreaderComment != "") {
    return unit.proofreaderComment;
  }

  return null;
}

export function isUnitSame(rhs: Unit, lhs: Unit): boolean {
  if (rhs.id !== lhs.id) {
    return false;
  }
  if (rhs.xCoord !== lhs.xCoord || rhs.yCoord !== lhs.yCoord) {
    return false;
  }
  if (rhs.index !== lhs.index) {
    return false;
  }
  if (rhs.isBubble !== lhs.isBubble) {
    return false;
  }
  if (rhs.isProofread !== lhs.isProofread) {
    return false;
  }
  if (rhs.translatorId !== lhs.translatorId) {
    return false;
  }
  if (rhs.proofreaderId !== lhs.proofreaderId) {
    return false;
  }
  if (unitTranslatedText(rhs) !== unitTranslatedText(lhs)) {
    return false;
  }
  if (unitProofreadText(rhs) !== unitProofreadText(lhs)) {
    return false;
  }
  if (unitTranslatorComment(rhs) !== unitTranslatorComment(lhs)) {
    return false;
  }
  if (unitProofreaderComment(rhs) !== unitProofreaderComment(lhs)) {
    return false;
  }

  return true;
}
