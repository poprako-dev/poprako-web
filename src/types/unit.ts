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

  proved: boolean;
  provedText?: string;
  proofreaderId?: string;
  proofreaderComment?: string;

  // 是否有未保存的修改，用于辨别当前 unit
  // 是否需要在必要时候被刷入 buffer 以及远程
  isDirty?: boolean;
};

export function unitIsTranslated(unit: Unit): boolean {
  return unit.translatedText !== undefined && unit.translatedText != "";
}

export function unitIsProved(unit: Unit): boolean {
  return unit.proved;
}

export function unitFinalText(unit: Unit): string | null {
  if (unit.provedText && unit.provedText != "") {
    return unit.provedText;
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

export function unitProvedText(unit: Unit): string | null {
  if (unit.provedText && unit.provedText != "") {
    return unit.provedText;
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
  if (rhs.proved !== lhs.proved) {
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
  if (unitProvedText(rhs) !== unitProvedText(lhs)) {
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
