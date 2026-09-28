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
} from "@/routes/_authenticated/translator/business/unit/unit";

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

  if ("xCoord" in updates || "yCoord" in updates) {
    const position = unitPosition(nextUnit);

    nextUnit = modifyUnitPosition(
      nextUnit,
      "xCoord" in updates ? (updates.xCoord ?? position.xCoord) : position.xCoord,
      "yCoord" in updates ? (updates.yCoord ?? position.yCoord) : position.yCoord,
    );
  }

  if (updates.isFlagged !== undefined) {
    nextUnit = { ...nextUnit, isFlagged: updates.isFlagged };
  }

  if ("isBubble" in updates) {
    nextUnit = modifyUnitIsBubble(nextUnit, updates.isBubble ?? unitIsBubble(nextUnit));
  }

  if ("translatedText" in updates || "translatorId" in updates) {
    nextUnit = modifyUnitTranslatedText(
      nextUnit,
      "translatedText" in updates ? (updates.translatedText ?? null) : unitTranslatedText(nextUnit),
      "translatorId" in updates ? (updates.translatorId ?? null) : (nextUnit.translatorId ?? null),
    );
  }

  if ("translatorCommnet" in updates) {
    nextUnit = modifyUnitTranslatorComment(nextUnit, updates.translatorCommnet ?? null);
  }

  const hasProofreadContentUpdate = "proofreadText" in updates || "proofreaderId" in updates;

  if (hasProofreadContentUpdate) {
    // 校对文本更新不得影响 isProofread；状态只由下方的 isProofread 更新处理。
    nextUnit = modifyUnitProofreadText(
      nextUnit,
      "proofreadText" in updates ? (updates.proofreadText ?? null) : unitProofreadText(nextUnit),
      "proofreaderId" in updates
        ? (updates.proofreaderId ?? null)
        : (nextUnit.proofreaderId ?? null),
    );
  }

  if (!hasProofreadContentUpdate && "isProofread" in updates) {
    // 校对状态更新不得影响 proofreadText。
    nextUnit = modifyUnitIsProofread(nextUnit, updates.isProofread ?? unitIsProofread(nextUnit));
  }

  if ("proofreaderComment" in updates) {
    nextUnit = modifyUnitProofreaderComment(nextUnit, updates.proofreaderComment ?? null);
  }

  return nextUnit;
}
