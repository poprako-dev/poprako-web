import type { UnitInfo, UnitCreation, UnitPatch } from "../unit";

export type RawUnitInfo = {
  id: string;

  x_coord: number;
  y_coord: number;

  index: number;

  is_bubble: boolean;

  translated_text?: string;
  translator_id?: string;
  translator_comment?: string;

  is_proofread: boolean;
  proofread_text?: string;
  proofreader_id?: string;
  proofreader_comment?: string;
};

export function unwrapRawUnitInfo(raw: RawUnitInfo): UnitInfo {
  return {
    id: raw.id,
    xCoord: raw.x_coord,
    yCoord: raw.y_coord,
    index: raw.index,
    isBubble: raw.is_bubble,
    translatedText: raw.translated_text,
    translatorId: raw.translator_id,
    translatorCommnet: raw.translator_comment,
    isProofread: raw.is_proofread,
    proofreadText: raw.proofread_text,
    proofreaderId: raw.proofreader_id,
    proofreaderComment: raw.proofreader_comment,
  };
}

export type RawUnitCreation = {
  x_coord: number;
  y_coord: number;
  index: number;
  is_bubble: boolean;
  translated_text?: string;
  translator_id?: string;
  translator_comment?: string;
  is_proofread?: boolean;
  proofread_text?: string;
  proofreader_id?: string;
  proofreader_comment?: string;
};

export function wrapUnitCreation(unit: UnitCreation): RawUnitCreation {
  return {
    x_coord: unit.xCoord,
    y_coord: unit.yCoord,
    index: unit.index,
    is_bubble: unit.isBubble,
    translated_text: unit.translatedText,
    translator_id: unit.translatorId,
    translator_comment: unit.translatorCommnet,
    is_proofread: unit.isProofread || undefined,
    proofread_text: unit.proofreadText,
    proofreader_id: unit.proofreaderId,
    proofreader_comment: unit.proofreaderComment,
  };
}

export type RawUnitPatch = {
  id: string;
  x_coord?: number;
  y_coord?: number;
  index?: number;
  is_bubble?: boolean;
  translated_text?: string | null;
  translator_id?: string | null;
  translator_comment?: string | null;
  is_proofread?: boolean;
  proofread_text?: string | null;
  proofreader_id?: string | null;
  proofreader_comment?: string | null;
};

export function wrapUnitPatch(patch: UnitPatch): RawUnitPatch {
  const raw: RawUnitPatch = { id: patch.id };

  if (patch.xCoord !== undefined) raw.x_coord = patch.xCoord;
  if (patch.yCoord !== undefined) raw.y_coord = patch.yCoord;
  if (patch.index !== undefined) raw.index = patch.index;
  if (patch.isBubble !== undefined) raw.is_bubble = patch.isBubble;
  if (patch.translatedText !== undefined) raw.translated_text = patch.translatedText;
  if (patch.translatorId !== undefined) raw.translator_id = patch.translatorId;
  if (patch.translatorCommnet !== undefined) raw.translator_comment = patch.translatorCommnet;
  if (patch.isProofread !== undefined) raw.is_proofread = patch.isProofread;
  if (patch.proofreadText !== undefined) raw.proofread_text = patch.proofreadText;
  if (patch.proofreaderId !== undefined) raw.proofreader_id = patch.proofreaderId;
  if (patch.proofreaderComment !== undefined) raw.proofreader_comment = patch.proofreaderComment;

  return raw;
}
