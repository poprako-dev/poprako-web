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

  translatedText?: string;
  translatorId?: string;
  translatorCommnet?: string;

  isProofread: boolean;
  proofreadText?: string;
  proofreaderId?: string;
  proofreaderComment?: string;
};

export type UnitEdit = {
  xCoord?: number;
  yCoord?: number;
  index?: number;
  isBubble?: boolean;
  translatedText?: string;
  translatorId?: string;
  translatorCommnet?: string;
  isProofread?: boolean;
  proofreadText?: string;
  proofreaderId?: string;
  proofreaderComment?: string;
};

export function unitId(unit: Pick<UnitInfo, "id">): string {
  return unit.id;
}

export function unitIndex(unit: UnitInfo): number {
  return unit.index;
}

export function unitIsTranslated(unit: UnitInfo): boolean {
  return unit.translatedText != null && unit.translatedText != "";
}

export function unitIsProofread(unit: UnitInfo): boolean {
  return unit.isProofread;
}

export function unitFinalText(unit: UnitInfo): string | null {
  if (unit.proofreadText && unit.proofreadText != "") {
    return unit.proofreadText;
  }
  if (unit.translatedText && unit.translatedText != "") {
    return unit.translatedText;
  }

  return null;
}

export function unitTranslatedText(unit: UnitInfo): string | null {
  if (unit.translatedText && unit.translatedText != "") {
    return unit.translatedText;
  }

  return null;
}

export function unitProofreadText(unit: UnitInfo): string | null {
  if (unit.proofreadText && unit.proofreadText != "") {
    return unit.proofreadText;
  }

  return null;
}

export function unitTranslatorComment(unit: UnitInfo): string | null {
  if (unit.translatorCommnet && unit.translatorCommnet != "") {
    return unit.translatorCommnet;
  }

  return null;
}

export function unitProofreaderComment(unit: UnitInfo): string | null {
  if (unit.proofreaderComment && unit.proofreaderComment != "") {
    return unit.proofreaderComment;
  }

  return null;
}

export function createUnit(
  xCoord: number,
  yCoord: number,
  index: number,
  isBubble: boolean,
): UnitInfo {
  return {
    // 生成一个随机 ID，其在上传服务器时会被忽略
    id: self.crypto.randomUUID(),
    xCoord: xCoord,
    yCoord: yCoord,
    index: index,
    isBubble: isBubble,
    isProofread: false,
  } as UnitInfo;
}

export function modifyUnitPosition(
  unit: UnitInfo,
  xCoord: number,
  yCoord: number,
) {
  return {
    ...unit,
    xCoord: xCoord,
    yCoord: yCoord,
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
    index: index,
  };
}

export function modifyUnitIsBubble(unit: UnitInfo, isBubble: boolean) {
  return {
    ...unit,
    isBubble: isBubble,
  };
}

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
    isProofread: proofreadText != null && proofreadText != "",
    proofreadText: proofreadText ?? undefined,
    // 当 proofreadText 为空时，无论是否提供 proofreaderId 都不应该保留 proofreaderId
    proofreaderId: proofreadText ? (proofreaderId ?? undefined) : undefined,
  };
}

export function modifyUnitIsProofread(unit: UnitInfo, isProofread: boolean) {
  return {
    ...unit,
    isProofread: isProofread,
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

  if ("index" in updates) {
    nextUnit = modifyUnitIndex(nextUnit, updates.index ?? unitIndex(nextUnit));
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

  if ("isProofread" in updates && !hasProofreadContentUpdate) {
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
  if (unitIndex(current) !== unitIndex(baseline)) {
    patch.index = unitIndex(current);
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
    patch.isProofread = unitIsProofread(current);
  }
  if (unitProofreadText(current) !== unitProofreadText(baseline)) {
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

export type UnitPatch = {
  id: string;

  xCoord?: number;
  yCoord?: number;

  index?: number;

  isBubble?: boolean;

  translatedText?: string | null;
  translatorId?: string | null;
  translatorCommnet?: string | null;

  isProofread?: boolean;
  proofreadText?: string | null;
  proofreaderId?: string | null;
  proofreaderComment?: string | null;
};

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

export function unitPatchIndex(patch: UnitPatch): number | undefined {
  return patch.index;
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
