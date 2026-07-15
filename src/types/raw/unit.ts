import { modifyUnitIndex, type UnitInfo } from "../unit";
import type {
  UnitCreateOp,
  UnitDiff,
  UnitOp,
  UnitPayload,
  UnitSaveOp,
} from "@/features/BaseTranslator/types/type";

export type RawUnitInfo = {
  id: string;

  page_id: string;

  x_coord: number;
  y_coord: number;

  is_bubble: boolean;

  translated_text?: string;
  last_translator_id?: string;

  is_proofread: boolean;
  proofread_text?: string;
  last_proofreader_id?: string;

  created_at: number;
  updated_at: number;
};

export function unwrapRawUnitInfo(raw: RawUnitInfo): UnitInfo {
  return {
    id: raw.id,
    pageId: raw.page_id,
    xCoord: raw.x_coord,
    yCoord: raw.y_coord,
    index: 0,
    isBubble: raw.is_bubble,
    translatedText: raw.translated_text,
    translatorId: raw.last_translator_id,
    isProofread: raw.is_proofread,
    proofreadText: raw.proofread_text,
    proofreaderId: raw.last_proofreader_id,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  } as UnitInfo;
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
    units: (raw.unit_infos ?? []).map((u, i) =>
      modifyUnitIndex(unwrapRawUnitInfo(u), i),
    ),
  };
}

export type RawUnitPayload = {
  before_id?: string;
  x_coord: number;
  y_coord: number;
  is_bubble: boolean;
  is_proofread: boolean;
  translated_text: string | null;
  last_translator_id: string | null;
  proofread_text: string | null;
  last_proofreader_id: string | null;
};

export type RawUnitCreateOp = RawUnitPayload & {
  oper: "create";
  local_id: string;
};

export type RawUnitSaveOp = RawUnitPayload & {
  oper: "save";
  id: string;
};

export type RawUnitDeleteOp = {
  oper: "delete";
  id: string;
};

export type RawUnitOp = RawUnitCreateOp | RawUnitSaveOp | RawUnitDeleteOp;

function wrapUnitPayload(payload: UnitPayload): RawUnitPayload {
  return {
    before_id: payload.beforeId,
    x_coord: payload.xCoord,
    y_coord: payload.yCoord,
    is_bubble: payload.isBubble,
    is_proofread: payload.isProofread,
    translated_text: payload.translatedText,
    last_translator_id: payload.lastTranslatorId,
    proofread_text: payload.proofreadText,
    last_proofreader_id: payload.lastProofreaderId,
  };
}

function wrapCreateUnitOp(op: UnitCreateOp): RawUnitCreateOp {
  return { oper: "create", local_id: op.localId, ...wrapUnitPayload(op) };
}

function wrapSaveUnitOp(op: UnitSaveOp): RawUnitSaveOp {
  return { oper: "save", id: op.id, ...wrapUnitPayload(op) };
}

export function wrapUnitOp(op: UnitOp): RawUnitOp {
  switch (op.oper) {
    case "create":
      return wrapCreateUnitOp(op);
    case "save":
      return wrapSaveUnitOp(op);
    case "delete":
      return { oper: "delete", id: op.id };
  }
}

export type RawUnitDiff = {
  page_id: string;
  opers: RawUnitOp[];
};

export type RawSavePageUnitsResult = {
  local_id_mappers: Array<{
    local_id: string;
    unit_id: string;
  }>;
  total_unit_count: number;
  translated_unit_count: number;
  proofread_unit_count: number;
};

export type SavePageUnitsResult = {
  localIdMappers: Array<{
    localId: string;
    unitId: string;
  }>;
  totalUnitCount: number;
  translatedUnitCount: number;
  proofreadUnitCount: number;
};

export function unwrapRawSavePageUnitsResult(
  raw: RawSavePageUnitsResult,
): SavePageUnitsResult {
  return {
    localIdMappers: raw.local_id_mappers.map((mapper) => ({
      localId: mapper.local_id,
      unitId: mapper.unit_id,
    })),
    totalUnitCount: raw.total_unit_count,
    translatedUnitCount: raw.translated_unit_count,
    proofreadUnitCount: raw.proofread_unit_count,
  };
}

export function wrapUnitDiff(pageId: string, diff: UnitDiff): RawUnitDiff {
  return {
    page_id: pageId,
    opers: diff.ops.map(wrapUnitOp),
  };
}
