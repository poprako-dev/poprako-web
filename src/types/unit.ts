// 该包有关联及其复杂的逻辑，因此绝对不允许直接使用其类型的字段
// 必须通过关联的函数提供封装性，防止错误逻辑散落到其他文件

export interface UnitInfo {
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
}

export interface UnitEdit {
  xCoord?: number | undefined;
  yCoord?: number | undefined;
  isBubble?: boolean | undefined;
  isFlagged?: boolean | undefined;
  translatedText?: string | undefined;
  translatorId?: string | undefined;
  translatorCommnet?: string | undefined;
  // 仅表示校对流程状态；与 proofreadText 完全独立，二者不得互相推导或隐式修改。
  isProofread?: boolean | undefined;
  proofreadText?: string | undefined;
  proofreaderId?: string | undefined;
  proofreaderComment?: string | undefined;
}

export function unitId(unit: Pick<UnitInfo, "id">): string {
  return unit.id;
}

export function isUnitFlagged(unit: UnitInfo): boolean {
  return unit.isFlagged;
}

export function unitIndex(unit: UnitInfo): number {
  return unit.index;
}

// eslint-disable-next-line unicorn/consistent-boolean-name
export function unitIsTranslated(unit: UnitInfo): boolean {
  return Boolean(unit.translatedText);
}

// eslint-disable-next-line unicorn/consistent-boolean-name
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

export function createUnit(
  xCoord: number,
  yCoord: number,
  isBubble: boolean,
): UnitInfo {
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

export function modifyUnitPosition(
  unit: UnitInfo,
  xCoord: number,
  yCoord: number,
) {
  return {
    ...unit,
    xCoord,
    yCoord,
  };
}

export function modifyUnitPostion(
  unit: UnitInfo,
  xCoord: number,
  yCoord: number,
) {
  return modifyUnitPosition(unit, xCoord, yCoord);
}

export function unitPosition(unit: UnitInfo) {
  return { xCoord: unit.xCoord, yCoord: unit.yCoord };
}

export function modifyUnitIndex(unit: UnitInfo, index: number) {
  return {
    ...unit,
    index,
  };
}

export function normalizeUnitIndexes(units: UnitInfo[]): UnitInfo[] {
  return units.map((unit, index) =>
    unit.index === index ? unit : modifyUnitIndex(unit, index),
  );
}

export function moveUnitToIndex(
  units: UnitInfo[],
  targetUnitId: string,
  targetIndex: number,
): UnitInfo[] {
  const sourceIndex = units.findIndex((unit) => unitId(unit) === targetUnitId);
  if (sourceIndex === -1) {return units;}

  const nextUnits = [...units];
  const [targetUnit] = nextUnits.splice(sourceIndex, 1);
  if (!targetUnit) {return units;}
  const boundedIndex = Math.max(0, Math.min(targetIndex, nextUnits.length));
  nextUnits.splice(boundedIndex, 0, targetUnit);

  return normalizeUnitIndexes(nextUnits);
}

export function modifyUnitIsBubble(unit: UnitInfo, isBubble: boolean) {
  return {
    ...unit,
    isBubble,
  };
}

// eslint-disable-next-line unicorn/consistent-boolean-name
export function unitIsBubble(unit: UnitInfo) {
  return unit.isBubble;
}

export function modifyUnitTranslatedText(
  unit: UnitInfo,
  translatedText: string | null,
  translatorId: string | null,
) {
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
) {
  return {
    ...unit,
    // proofreadText 与 isProofread 完全独立：修改或清空文本不得改变校对状态。
    proofreadText: proofreadText ?? undefined,
    // 当 proofreadText 为空时，无论是否提供 proofreaderId 都不应该保留 proofreaderId
    proofreaderId: proofreadText ? (proofreaderId ?? undefined) : undefined,
  };
}

export function modifyUnitIsProofread(unit: UnitInfo, isProofread: boolean) {
  return {
    ...unit,
    // isProofread 与 proofreadText 完全独立：切换状态不得改变校对文本。
    isProofread,
  };
}

export function modifyUnitTranslatorComment(
  unit: UnitInfo,
  translatorComment: string | null,
) {
  return {
    ...unit,
    translatorCommnet: translatorComment ?? undefined,
  };
}

export function modifyUnitProofreaderComment(
  unit: UnitInfo,
  proofreaderComment: string | null,
) {
  return {
    ...unit,
    proofreaderComment: proofreaderComment ?? undefined,
  };
}

export function applyUnitUpdates(unit: UnitInfo, updates: UnitEdit): UnitInfo {
  let nextUnit = unit;

  if ("xCoord" in updates || "yCoord" in updates) {
    const position = unitPosition(nextUnit);

    nextUnit = modifyUnitPosition(
      nextUnit,
      "xCoord" in updates
        ? (updates.xCoord ?? position.xCoord)
        : position.xCoord,
      "yCoord" in updates
        ? (updates.yCoord ?? position.yCoord)
        : position.yCoord,
    );
  }

  if (updates.isFlagged !== undefined) {
    nextUnit = { ...nextUnit, isFlagged: updates.isFlagged };
  }

  if ("isBubble" in updates) {
    nextUnit = modifyUnitIsBubble(
      nextUnit,
      updates.isBubble ?? unitIsBubble(nextUnit),
    );
  }

  if ("translatedText" in updates || "translatorId" in updates) {
    nextUnit = modifyUnitTranslatedText(
      nextUnit,
      "translatedText" in updates
        ? (updates.translatedText ?? null)
        : unitTranslatedText(nextUnit),
      "translatorId" in updates
        ? (updates.translatorId ?? null)
        : (nextUnit.translatorId ?? null),
    );
  }

  if ("translatorCommnet" in updates) {
    nextUnit = modifyUnitTranslatorComment(
      nextUnit,
      updates.translatorCommnet ?? null,
    );
  }

  const hasProofreadContentUpdate =
    "proofreadText" in updates || "proofreaderId" in updates;

  if (hasProofreadContentUpdate) {
    // 校对文本更新不得影响 isProofread；状态只由下方的 isProofread 更新处理。
    nextUnit = modifyUnitProofreadText(
      nextUnit,
      "proofreadText" in updates
        ? (updates.proofreadText ?? null)
        : unitProofreadText(nextUnit),
      "proofreaderId" in updates
        ? (updates.proofreaderId ?? null)
        : (nextUnit.proofreaderId ?? null),
    );
  }

  if (!hasProofreadContentUpdate && "isProofread" in updates) {
    // 校对状态更新不得影响 proofreadText。
    nextUnit = modifyUnitIsProofread(
      nextUnit,
      updates.isProofread ?? unitIsProofread(nextUnit),
    );
  }

  if ("proofreaderComment" in updates) {
    nextUnit = modifyUnitProofreaderComment(
      nextUnit,
      updates.proofreaderComment ?? null,
    );
  }

  return nextUnit;
}

export function createUnitPatch(
  current: UnitInfo,
  baseline: UnitInfo,
): UnitPatch {
  const patch: UnitPatch = { id: unitId(current) };
  const currentPosition = unitPosition(current);
  const baselinePosition = unitPosition(baseline);

  if (currentPosition.xCoord !== baselinePosition.xCoord) {
    patch.xCoord = currentPosition.xCoord;
  }
  if (currentPosition.yCoord !== baselinePosition.yCoord) {
    patch.yCoord = currentPosition.yCoord;
  }
  if (isUnitFlagged(current) !== isUnitFlagged(baseline)) {
    patch.isFlagged = isUnitFlagged(current);
  }
  if (unitIsBubble(current) !== unitIsBubble(baseline)) {
    patch.isBubble = unitIsBubble(current);
  }
  if (unitTranslatedText(current) !== unitTranslatedText(baseline)) {
    patch.translatedText = unitTranslatedText(current);
  }
  if (current.translatorId !== baseline.translatorId) {
    patch.translatorId = current.translatorId ?? null;
  }
  if (unitTranslatorComment(current) !== unitTranslatorComment(baseline)) {
    patch.translatorCommnet = unitTranslatorComment(current);
  }
  if (unitIsProofread(current) !== unitIsProofread(baseline)) {
    // 校对状态与文本独立，分别生成 patch。
    patch.isProofread = unitIsProofread(current);
  }
  if (unitProofreadText(current) !== unitProofreadText(baseline)) {
    // 校对文本与状态独立，分别生成 patch。
    patch.proofreadText = unitProofreadText(current);
  }
  if (current.proofreaderId !== baseline.proofreaderId) {
    patch.proofreaderId = current.proofreaderId ?? null;
  }
  if (unitProofreaderComment(current) !== unitProofreaderComment(baseline)) {
    patch.proofreaderComment = unitProofreaderComment(current);
  }

  return patch;
}

export function isUnitSame(rhs: UnitInfo, lhs: UnitInfo): boolean {
  if (rhs.id !== lhs.id) {
    return false;
  }
  if (rhs.xCoord !== lhs.xCoord || rhs.yCoord !== lhs.yCoord) {
    return false;
  }
  if (isUnitFlagged(rhs) !== isUnitFlagged(lhs)) {
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

export interface UnitPatch {
  id: string;

  xCoord?: number | undefined;
  yCoord?: number | undefined;

  isBubble?: boolean | undefined;
  isFlagged?: boolean | undefined;

  translatedText?: string | null | undefined;
  translatorId?: string | null | undefined;
  translatorCommnet?: string | null | undefined;

  // 仅表示校对流程状态；与 proofreadText 完全独立，二者不得互相推导或隐式修改。
  isProofread?: boolean | undefined;
  proofreadText?: string | null | undefined;
  proofreaderId?: string | null | undefined;
  proofreaderComment?: string | null | undefined;
}

export type UnitCreation = UnitInfo;

export function createUnitCreation(unit: UnitInfo): UnitCreation {
  return unit;
}

export function unitPatchId(patch: UnitPatch): string {
  return patch.id;
}

export function unitPatchPosition(patch: UnitPatch) {
  return { xCoord: patch.xCoord, yCoord: patch.yCoord };
}

export function unitPatchIsBubble(patch: UnitPatch): boolean | undefined {
  return patch.isBubble;
}

export function unitPatchTranslatedText(
  patch: UnitPatch,
): string | null | undefined {
  return patch.translatedText;
}

export function unitPatchTranslatorId(
  patch: UnitPatch,
): string | null | undefined {
  return patch.translatorId;
}

export function unitPatchTranslatorComment(
  patch: UnitPatch,
): string | null | undefined {
  return patch.translatorCommnet;
}

export function unitPatchIsProofread(patch: UnitPatch): boolean | undefined {
  return patch.isProofread;
}

export function unitPatchProofreadText(
  patch: UnitPatch,
): string | null | undefined {
  return patch.proofreadText;
}

export function unitPatchProofreaderId(
  patch: UnitPatch,
): string | null | undefined {
  return patch.proofreaderId;
}

export function unitPatchProofreaderComment(
  patch: UnitPatch,
): string | null | undefined {
  return patch.proofreaderComment;
}
