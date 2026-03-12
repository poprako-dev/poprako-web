import { randomUUID } from "crypto";

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

export type UnitUpdate = Partial<Omit<Unit, "id">>;

export type UnitPatch = { id: Unit["id"] } & UnitUpdate;

function hasUnitField<K extends keyof UnitUpdate>(
  updates: UnitUpdate,
  key: K,
): updates is UnitUpdate & Required<Pick<UnitUpdate, K>> {
  return Object.prototype.hasOwnProperty.call(updates, key);
}

export function unitId(unit: Pick<Unit, "id">): string {
  return unit.id;
}

export function unitIndex(unit: Unit): number {
  return unit.index;
}

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

export function createUnit(
  xCoord: number,
  yCoord: number,
  index: number,
  isBubble: boolean,
): Unit {
  return {
    // 生成一个随机 ID，其在上传服务器时会被忽略
    id: randomUUID(),
    xCoord: xCoord,
    yCoord: yCoord,
    index: index,
    isBubble: isBubble,
    isProofread: false,
  } as Unit;
}

export function modifyUnitPosition(unit: Unit, xCoord: number, yCoord: number) {
  return {
    ...unit,
    xCoord: xCoord,
    yCoord: yCoord,
  };
}

export function modifyUnitPostion(unit: Unit, xCoord: number, yCoord: number) {
  return modifyUnitPosition(unit, xCoord, yCoord);
}

export function unitPosition(unit: Unit) {
  return { xCoord: unit.xCoord, yCoord: unit.yCoord };
}

export function modifyUnitIndex(unit: Unit, index: number) {
  return {
    ...unit,
    index: index,
  };
}

export function modifyUnitIsBubble(unit: Unit, isBubble: boolean) {
  return {
    ...unit,
    isBubble: isBubble,
  };
}

export function unitIsBubble(unit: Unit) {
  return unit.isBubble;
}

export function modifyUnitTranslatedText(
  unit: Unit,
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
  unit: Unit,
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

export function modifyUnitIsProofread(unit: Unit, isProofread: boolean) {
  return {
    ...unit,
    isProofread: isProofread,
  };
}

export function modifyUnitTranslatorComment(
  unit: Unit,
  translatorComment: string | null,
) {
  return {
    ...unit,
    translatorCommnet: translatorComment ?? undefined,
  };
}

export function modifyUnitProofreaderComment(
  unit: Unit,
  proofreaderComment: string | null,
) {
  return {
    ...unit,
    proofreaderComment: proofreaderComment ?? undefined,
  };
}

export function applyUnitUpdates(unit: Unit, updates: UnitUpdate): Unit {
  let nextUnit = unit;

  if (hasUnitField(updates, "xCoord") || hasUnitField(updates, "yCoord")) {
    const position = unitPosition(nextUnit);

    nextUnit = modifyUnitPosition(
      nextUnit,
      hasUnitField(updates, "xCoord") ? updates.xCoord : position.xCoord,
      hasUnitField(updates, "yCoord") ? updates.yCoord : position.yCoord,
    );
  }

  if (hasUnitField(updates, "index")) {
    nextUnit = modifyUnitIndex(nextUnit, updates.index);
  }

  if (hasUnitField(updates, "isBubble")) {
    nextUnit = modifyUnitIsBubble(nextUnit, updates.isBubble);
  }

  if (
    hasUnitField(updates, "translatedText") ||
    hasUnitField(updates, "translatorId")
  ) {
    nextUnit = modifyUnitTranslatedText(
      nextUnit,
      hasUnitField(updates, "translatedText")
        ? (updates.translatedText ?? null)
        : unitTranslatedText(nextUnit),
      hasUnitField(updates, "translatorId")
        ? (updates.translatorId ?? null)
        : (nextUnit.translatorId ?? null),
    );
  }

  if (hasUnitField(updates, "translatorCommnet")) {
    nextUnit = modifyUnitTranslatorComment(
      nextUnit,
      updates.translatorCommnet ?? null,
    );
  }

  const hasProofreadContentUpdate =
    hasUnitField(updates, "proofreadText") ||
    hasUnitField(updates, "proofreaderId");

  if (hasProofreadContentUpdate) {
    nextUnit = modifyUnitProofreadText(
      nextUnit,
      hasUnitField(updates, "proofreadText")
        ? (updates.proofreadText ?? null)
        : unitProofreadText(nextUnit),
      hasUnitField(updates, "proofreaderId")
        ? (updates.proofreaderId ?? null)
        : (nextUnit.proofreaderId ?? null),
    );
  }

  if (hasUnitField(updates, "isProofread") && !hasProofreadContentUpdate) {
    nextUnit = modifyUnitIsProofread(nextUnit, updates.isProofread);
  }

  if (hasUnitField(updates, "proofreaderComment")) {
    nextUnit = modifyUnitProofreaderComment(
      nextUnit,
      updates.proofreaderComment ?? null,
    );
  }

  return nextUnit;
}

export function createUnitPatch(current: Unit, baseline: Unit): UnitPatch {
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
    patch.translatedText = unitTranslatedText(current) ?? undefined;
  }
  if (current.translatorId !== baseline.translatorId) {
    patch.translatorId = current.translatorId;
  }
  if (unitTranslatorComment(current) !== unitTranslatorComment(baseline)) {
    patch.translatorCommnet = unitTranslatorComment(current) ?? undefined;
  }
  if (unitIsProofread(current) !== unitIsProofread(baseline)) {
    patch.isProofread = unitIsProofread(current);
  }
  if (unitProofreadText(current) !== unitProofreadText(baseline)) {
    patch.proofreadText = unitProofreadText(current) ?? undefined;
  }
  if (current.proofreaderId !== baseline.proofreaderId) {
    patch.proofreaderId = current.proofreaderId;
  }
  if (unitProofreaderComment(current) !== unitProofreaderComment(baseline)) {
    patch.proofreaderComment = unitProofreaderComment(current) ?? undefined;
  }

  return patch;
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
