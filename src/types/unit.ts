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
