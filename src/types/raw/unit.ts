import type { UnitInfo } from "../unit";
import type { UnitDiff, UnitOp } from "@/features/BaseTranslator/types/type";

export type RawUnitInfo = {
  id: string;

  x_coord: number;
  y_coord: number;

  index: number;

  is_bubble: boolean;

  translated_text?: string;
  translator_id?: string;
  last_translator_id?: string;
  translator_comment?: string;

  is_proofread: boolean;
  proofread_text?: string;
  proofreader_id?: string;
  last_proofreader_id?: string;
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
    translatorId: raw.last_translator_id ?? raw.translator_id,
    translatorCommnet: raw.translator_comment,
    isProofread: raw.is_proofread,
    proofreadText: raw.proofread_text,
    proofreaderId: raw.last_proofreader_id ?? raw.proofreader_id,
    proofreaderComment: raw.proofreader_comment,
  };
}

export type ListPageUnitsResult = {
  totalUnitCount: number;
  translatedUnitCount: number;
  proofreadUnitCount: number;
  units: UnitInfo[];
};

export type RawListPageUnitsResult = {
  total_unit_count: number;
  translated_unit_count: number;
  proofread_unit_count: number;
  unit_infos?: RawUnitInfo[];
};

export function unwrapRawListPageUnitsResult(
  raw: RawListPageUnitsResult,
): ListPageUnitsResult {
  return {
    totalUnitCount: raw.total_unit_count,
    translatedUnitCount: raw.translated_unit_count,
    proofreadUnitCount: raw.proofread_unit_count,
    units: (raw.unit_infos ?? []).map(unwrapRawUnitInfo),
  };
}

export type RawUnitOp = {
  oper: "save" | "delete";
  id?: string;
  local_id?: string;
  before_id?: string;
  x_coord?: number;
  y_coord?: number;
  is_bubble?: boolean;
  is_proofread?: boolean;
  translated_text?: string | null;
  last_translator_id?: string | null;
  proofread_text?: string | null;
  last_proofreader_id?: string | null;
};

export function wrapUnitOp(op: UnitOp): RawUnitOp {
  if (!("xCoord" in op) && !("localId" in op) && !("beforeId" in op)) {
    return { oper: "delete", id: op.id };
  }

  const raw: RawUnitOp = { oper: "save" };

  if (op.id !== undefined) raw.id = op.id;
  if (op.localId !== undefined) raw.local_id = op.localId;
  if (op.beforeId !== undefined) raw.before_id = op.beforeId;
  if (op.xCoord !== undefined) raw.x_coord = op.xCoord;
  if (op.yCoord !== undefined) raw.y_coord = op.yCoord;
  if (op.isBubble !== undefined) raw.is_bubble = op.isBubble;
  if (op.isProofread !== undefined) raw.is_proofread = op.isProofread;
  if (op.translatedText !== undefined) raw.translated_text = op.translatedText;
  if (op.lastTranslatorId !== undefined) {
    raw.last_translator_id = op.lastTranslatorId;
  }
  if (op.proofreadText !== undefined) raw.proofread_text = op.proofreadText;
  if (op.lastProofreaderId !== undefined) {
    raw.last_proofreader_id = op.lastProofreaderId;
  }

  return raw;
}

export type RawUnitDiff = {
  page_id: string;
  opers: RawUnitOp[];
};

export function wrapUnitDiff(pageId: string, diff: UnitDiff): RawUnitDiff {
  return {
    page_id: pageId,
    opers: diff.ops.map(wrapUnitOp),
  };
}

export type RawLegacyUnitPatch = {
  id: string;
  x_coord?: number;
  y_coord?: number;
  is_bubble?: boolean;
  translated_text?: string | null;
  translator_id?: string | null;
  translator_comment?: string | null;
  is_proofread?: boolean;
  proofread_text?: string | null;
  proofreader_id?: string | null;
  proofreader_comment?: string | null;
};
