import {
  isUnitFlagged,
  unitId,
  type UnitInfo,
  unitIsBubble,
  unitIsProofread,
  unitPosition,
  unitProofreaderComment,
  unitProofreadText,
  unitTranslatedText,
  unitTranslatorComment,
} from "@/routes/_authenticated/translator/business/unit/unit";

export function createUnitPatch(current: UnitInfo, baseline: UnitInfo): UnitPatch {
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

export type UnitPatch = {
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
};

export type UnitCreation = UnitInfo;

export function createUnitCreation(unit: UnitInfo): UnitCreation {
  return unit;
}

export function unitPatchId(patch: UnitPatch): string {
  return patch.id;
}

export function unitPatchPosition(patch: UnitPatch): Pick<UnitPatch, "xCoord" | "yCoord"> {
  return { xCoord: patch.xCoord, yCoord: patch.yCoord };
}

export function unitPatchIsBubble(patch: UnitPatch): boolean | undefined {
  return patch.isBubble;
}

export function unitPatchTranslatedText(patch: UnitPatch): string | null | undefined {
  return patch.translatedText;
}

export function unitPatchTranslatorId(patch: UnitPatch): string | null | undefined {
  return patch.translatorId;
}

export function unitPatchTranslatorComment(patch: UnitPatch): string | null | undefined {
  return patch.translatorCommnet;
}

export function unitPatchIsProofread(patch: UnitPatch): boolean | undefined {
  return patch.isProofread;
}

export function unitPatchProofreadText(patch: UnitPatch): string | null | undefined {
  return patch.proofreadText;
}

export function unitPatchProofreaderId(patch: UnitPatch): string | null | undefined {
  return patch.proofreaderId;
}

export function unitPatchProofreaderComment(patch: UnitPatch): string | null | undefined {
  return patch.proofreaderComment;
}
