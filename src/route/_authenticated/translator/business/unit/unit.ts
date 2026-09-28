// 该包有关联及其复杂的逻辑，因此绝对不允许直接使用其类型的字段
// 必须通过关联的函数提供封装性，防止错误逻辑散落到其他文件

export type UnitInfo = {
  id: string;

  // 均为 0~1 的浮点数
  xCoord: number;
  yCoord: number;

  // 0-based 的页内索引
  index: number;

  // 是否为框内文本，否则是框外文本
  isBubble: boolean;
  isFlagged: boolean;

  translatedText?: string | undefined;
  translatorId?: string | undefined;
  translatorCommnet?: string | undefined;

  // 仅表示校对流程状态；与 proofreadText 完全独立，二者不得互相推导或隐式修改。
  isProofread: boolean;
  proofreadText?: string | undefined;
  proofreaderId?: string | undefined;
  proofreaderComment?: string | undefined;
};

export function unitId(unit: Pick<UnitInfo, "id">): string {
  return unit.id;
}

export function isUnitFlagged(unit: UnitInfo): boolean {
  return unit.isFlagged;
}

export function unitIndex(unit: UnitInfo): number {
  return unit.index;
}

export function unitIsTranslated(unit: UnitInfo): boolean {
  return Boolean(unit.translatedText);
}

export function unitIsProofread(unit: UnitInfo): boolean {
  return unit.isProofread;
}

export function unitFinalText(unit: UnitInfo): string | null {
  if (unit.proofreadText && unit.proofreadText !== "") {
    return unit.proofreadText;
  }
  if (unit.translatedText && unit.translatedText !== "") {
    return unit.translatedText;
  }

  return null;
}

export function unitTranslatedText(unit: UnitInfo): string | null {
  if (unit.translatedText && unit.translatedText !== "") {
    return unit.translatedText;
  }

  return null;
}

export function unitTranslatorId(unit: UnitInfo): string | null {
  return unit.translatorId ?? null;
}

export function unitProofreadText(unit: UnitInfo): string | null {
  if (unit.proofreadText && unit.proofreadText !== "") {
    return unit.proofreadText;
  }

  return null;
}

export function unitProofreaderId(unit: UnitInfo): string | null {
  return unit.proofreaderId ?? null;
}

export function unitTranslatorComment(unit: UnitInfo): string | null {
  if (unit.translatorCommnet && unit.translatorCommnet !== "") {
    return unit.translatorCommnet;
  }

  return null;
}

export function unitProofreaderComment(unit: UnitInfo): string | null {
  if (unit.proofreaderComment && unit.proofreaderComment !== "") {
    return unit.proofreaderComment;
  }

  return null;
}

export function createUnit(xCoord: number, yCoord: number, isBubble: boolean): UnitInfo {
  return {
    // 生成一个随机 ID，其在上传服务器时会被忽略
    id: crypto.randomUUID(),
    xCoord,
    yCoord,
    index: 0,
    isBubble,
    isFlagged: false,
    isProofread: false,
  };
}

export function modifyUnitPosition(unit: UnitInfo, xCoord: number, yCoord: number): UnitInfo {
  return {
    ...unit,
    xCoord,
    yCoord,
  };
}

export function modifyUnitPostion(unit: UnitInfo, xCoord: number, yCoord: number): UnitInfo {
  return modifyUnitPosition(unit, xCoord, yCoord);
}

export function unitPosition(unit: UnitInfo): { xCoord: number; yCoord: number } {
  return { xCoord: unit.xCoord, yCoord: unit.yCoord };
}

export function modifyUnitIndex(unit: UnitInfo, index: number): UnitInfo {
  return {
    ...unit,
    index,
  };
}

export function normalizeUnitIndexes(units: UnitInfo[]): UnitInfo[] {
  return units.map((unit, index) => (unit.index === index ? unit : modifyUnitIndex(unit, index)));
}

export function moveUnitToIndex(
  units: UnitInfo[],
  targetUnitId: string,
  targetIndex: number,
): UnitInfo[] {
  const sourceIndex = units.findIndex((unit) => unitId(unit) === targetUnitId);
  if (sourceIndex === -1) return units;

  const nextUnits = [...units];
  const [targetUnit] = nextUnits.splice(sourceIndex, 1);
  if (!targetUnit) return units;
  const boundedIndex = Math.max(0, Math.min(targetIndex, nextUnits.length));
  nextUnits.splice(boundedIndex, 0, targetUnit);

  return normalizeUnitIndexes(nextUnits);
}

export function modifyUnitIsBubble(unit: UnitInfo, isBubble: boolean): UnitInfo {
  return {
    ...unit,
    isBubble,
  };
}

export function unitIsBubble(unit: UnitInfo): boolean {
  return unit.isBubble;
}

export function modifyUnitTranslatedText(
  unit: UnitInfo,
  translatedText: string | null,
  translatorId: string | null,
): UnitInfo {
  return {
    ...unit,
    translatedText: translatedText ?? undefined,
    // 当 translatedText 为空时，无论是否提供 translatorId 都不应该保留 translatorId
    translatorId: translatedText ? (translatorId ?? undefined) : undefined,
  };
}

export function modifyUnitProofreadText(
  unit: UnitInfo,
  proofreadText: string | null,
  proofreaderId: string | null,
): UnitInfo {
  return {
    ...unit,
    // proofreadText 与 isProofread 完全独立：修改或清空文本不得改变校对状态。
    proofreadText: proofreadText ?? undefined,
    // 当 proofreadText 为空时，无论是否提供 proofreaderId 都不应该保留 proofreaderId
    proofreaderId: proofreadText ? (proofreaderId ?? undefined) : undefined,
  };
}

export function modifyUnitIsProofread(unit: UnitInfo, isProofread: boolean): UnitInfo {
  return {
    ...unit,
    // isProofread 与 proofreadText 完全独立：切换状态不得改变校对文本。
    isProofread,
  };
}

export function modifyUnitTranslatorComment(
  unit: UnitInfo,
  translatorComment: string | null,
): UnitInfo {
  return {
    ...unit,
    translatorCommnet: translatorComment ?? undefined,
  };
}

export function modifyUnitProofreaderComment(
  unit: UnitInfo,
  proofreaderComment: string | null,
): UnitInfo {
  return {
    ...unit,
    proofreaderComment: proofreaderComment ?? undefined,
  };
}
