import { modifyUnitIndex, type UnitInfo } from "../unit";
import type {
  UnitCreateOp,
  UnitDiff,
  UnitOp,
  UnitPatchOp,
  Patch,
} from "@/features/BaseTranslator/types/type";
import type { UnitSearchMatch } from
  "@/features/BaseTranslator/types/unitSearchTransform";

export interface RawUnitInfo {
  id: string;

  page_id: string;

  x_coord: number;
  y_coord: number;

  is_bubble: boolean;
  is_flagged: boolean;

  translated_text?: string | undefined;
  last_translator_id?: string | undefined;

  // 仅表示校对流程状态；与 proofread_text 完全独立，二者不得互相推导或隐式修改。
  is_proofread: boolean;
  proofread_text?: string | undefined;
  last_proofreader_id?: string | undefined;

  created_at: number;
  updated_at: number;
}

export function unwrapRawUnitInfo(raw: RawUnitInfo): UnitInfo {
  return {
    id: raw.id,
    pageId: raw.page_id,
    xCoord: raw.x_coord,
    yCoord: raw.y_coord,
    index: 0,
    isBubble: raw.is_bubble,
    isFlagged: raw.is_flagged,
    translatedText: raw.translated_text,
    translatorId: raw.last_translator_id,
    isProofread: raw.is_proofread,
    proofreadText: raw.proofread_text,
    proofreaderId: raw.last_proofreader_id,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  } as UnitInfo;
}

export function unwrapRawUnitSearchMatch(raw: RawUnitInfo): UnitSearchMatch {
  return {
    pageId: raw.page_id,
    unit: unwrapRawUnitInfo(raw),
  };
}

export type RawUnitTextPart = "translated_text" | "proofread_text";

export interface RawTransformChapterUnitsArgs {
  part: RawUnitTextPart;
  units: {
    unit_id: string;
    transforms: {
      origin: string;
      target: string;
    }[];
  }[];
}

export interface ListPageUnitsResult {
  totalUnitCount: number;
  translatedUnitCount: number;
  proofreadUnitCount: number;
  units: UnitInfo[];
}

export interface RawListPageUnitsResult {
  total_unit_count: number;
  translated_unit_count: number;
  proofread_unit_count: number;
  unit_infos?: RawUnitInfo[] | undefined;
}

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

export interface RawUnitCoord {
  x_coord: number;
  y_coord: number;
}

export interface RawUnitTranslation {
  translated_text: string;
}

export interface RawUnitRevision {
  // 仅表示校对流程状态；与 proofread_text 完全独立，二者不得互相推导或隐式修改。
  is_proofread: boolean;
  proofread_text?: string | undefined;
}

export type RawPatch<T> =
  | { type: "clear" }
  | { type: "assign"; value: T };

export interface RawUnitCreateEdit {
  edit: "create";
  local_id: string;
  next_id?: string | undefined;
  is_bubble: boolean;
  is_flagged: boolean;
  coord: RawUnitCoord;
  translation?: RawUnitTranslation | undefined;
  revision?: RawUnitRevision | undefined;
}

export interface RawUnitPatchEdit {
  edit: "patch";
  id: string;
  next_id?: RawPatch<string> | undefined;
  is_bubble?: boolean | undefined;
  is_flagged?: boolean | undefined;
  coord?: RawUnitCoord | undefined;
  translation?: RawPatch<RawUnitTranslation> | undefined;
  revision?: RawPatch<RawUnitRevision> | undefined;
}

export interface RawUnitDeleteEdit {
  edit: "delete";
  id: string;
}

export type RawUnitEdit = RawUnitCreateEdit | RawUnitPatchEdit | RawUnitDeleteEdit;

function wrapUnitCoord(payload: { xCoord: number; yCoord: number }): RawUnitCoord {
  return {
    x_coord: payload.xCoord,
    y_coord: payload.yCoord,
  };
}

function wrapPatch<T, R>(
  patch: Patch<T>,
  wrap: (value: T) => R,
): RawPatch<R> | undefined {
  switch (patch.type) {
    case "skip": {
      return undefined;
    }
    case "clear": {
      return { type: "clear" };
    }
    case "assign": {
      return { type: "assign", value: wrap(patch.value) };
    }
  }
}

function wrapCreateUnitEdit(op: UnitCreateOp): RawUnitCreateEdit {
  return {
    edit: "create",
    local_id: op.localId,
    next_id: op.nextId,
    is_bubble: op.isBubble,
    is_flagged: op.isFlagged,
    coord: wrapUnitCoord(op.coord),
    translation: op.translation && { translated_text: op.translation.translatedText },
    revision: op.revision && {
      is_proofread: op.revision.isProofread,
      proofread_text: op.revision.proofreadText,
    },
  };
}

function wrapPatchUnitEdit(op: UnitPatchOp): RawUnitPatchEdit {
  return {
    edit: "patch",
    id: op.id,
    next_id: wrapPatch(op.nextId, (value) => value),
    is_bubble: op.isBubble,
    is_flagged: op.isFlagged,
    coord: op.coord && wrapUnitCoord(op.coord),
    translation: wrapPatch(
      op.translation,
      (value) => ({ translated_text: value.translatedText }),
    ),
    revision: wrapPatch(
      op.revision,
      (value) => ({
        is_proofread: value.isProofread,
        proofread_text: value.proofreadText,
      }),
    ),
  };
}

export function wrapUnitEdit(op: UnitOp): RawUnitEdit {
  switch (op.edit) {
    case "create": {
      return wrapCreateUnitEdit(op);
    }
    case "patch": {
      return wrapPatchUnitEdit(op);
    }
    case "delete": {
      return { edit: "delete", id: op.id };
    }
  }
}

export function wrapUnitDiff(diff: UnitDiff): RawUnitEdit[] {
  return diff.ops.map((op) => wrapUnitEdit(op));
}
