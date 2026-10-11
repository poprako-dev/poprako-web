import {
  modifyUnitIsBubble,
  modifyUnitIsProofread,
  modifyUnitPosition,
  modifyUnitProofreaderComment,
  modifyUnitProofreadText,
  modifyUnitTranslatedText,
  modifyUnitTranslatorComment,
  type UnitInfo,
  unitIsBubble,
  unitIsProofread,
  unitPosition,
  unitProofreadText,
  unitTranslatedText,
} from "@/route/_authenticated/translator/business/unit/unit";

export type UnitEdit = {
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
};

export function applyUnitUpdates(unit: UnitInfo, updates: UnitEdit): UnitInfo {
  let nextUnit = unit;
  nextUnit = applyGeometryUpdates(nextUnit, updates);
  if (updates.isFlagged !== undefined) {
    nextUnit = { ...nextUnit, isFlagged: updates.isFlagged };
  }
  nextUnit = applyTranslationUpdates(nextUnit, updates);
  nextUnit = applyProofreadUpdates(nextUnit, updates);
  return nextUnit;
}

function applyGeometryUpdates(unit: UnitInfo, updates: UnitEdit): UnitInfo {
  if (!("xCoord" in updates || "yCoord" in updates)) return unit;
  const position = unitPosition(unit);
  return modifyUnitPosition(
    unit,
    "xCoord" in updates ? (updates.xCoord ?? position.xCoord) : position.xCoord,
    "yCoord" in updates ? (updates.yCoord ?? position.yCoord) : position.yCoord,
  );
}

function applyTranslationUpdates(unit: UnitInfo, updates: UnitEdit): UnitInfo {
  let next = unit;
  if ("isBubble" in updates) {
    next = modifyUnitIsBubble(next, updates.isBubble ?? unitIsBubble(next));
  }
  if ("translatedText" in updates || "translatorId" in updates) {
    next = modifyUnitTranslatedText(
      next,
      "translatedText" in updates ? (updates.translatedText ?? null) : unitTranslatedText(next),
      "translatorId" in updates ? (updates.translatorId ?? null) : (next.translatorId ?? null),
    );
  }
  if ("translatorCommnet" in updates) {
    next = modifyUnitTranslatorComment(next, updates.translatorCommnet ?? null);
  }
  return next;
}

function applyProofreadUpdates(unit: UnitInfo, updates: UnitEdit): UnitInfo {
  let next = unit;
  const hasContentUpdate = "proofreadText" in updates || "proofreaderId" in updates;
  if (hasContentUpdate) {
    // 校对文本更新不得影响 isProofread；状态只由下方的 isProofread 更新处理。
    next = modifyUnitProofreadText(
      next,
      "proofreadText" in updates ? (updates.proofreadText ?? null) : unitProofreadText(next),
      "proofreaderId" in updates ? (updates.proofreaderId ?? null) : (next.proofreaderId ?? null),
    );
  }
  if (!hasContentUpdate && "isProofread" in updates) {
    // 校对状态更新不得影响 proofreadText。
    next = modifyUnitIsProofread(next, updates.isProofread ?? unitIsProofread(next));
  }
  if ("proofreaderComment" in updates) {
    next = modifyUnitProofreaderComment(next, updates.proofreaderComment ?? null);
  }
  return next;
}
