import { modifyUnitIndex, type UnitInfo } from "../unit";
import type {
  UnitCreateOp,
  UnitDiff,
  UnitOp,
  UnitPatchOp,
  Patch,
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

export type RawUnitCoord = {
  x_coord: number;
  y_coord: number;
};

export type RawUnitTranslation = {
  translated_text: string;
};

export type RawUnitRevision = {
  is_proofread: boolean;
  proofread_text?: string;
};

export type RawPatch<T> =
  | { type: "clear" }
  | { type: "assign"; value: T };

export type RawUnitCreateEdit = {
  edit: "create";
  local_id: string;
  next_id?: string;
  is_bubble: boolean;
  coord: RawUnitCoord;
  translation?: RawUnitTranslation;
  revision?: RawUnitRevision;
};

export type RawUnitPatchEdit = {
  edit: "patch";
  id: string;
  next_id?: RawPatch<string>;
  is_bubble?: boolean;
  coord?: RawUnitCoord;
  translation?: RawPatch<RawUnitTranslation>;
  revision?: RawPatch<RawUnitRevision>;
};

export type RawUnitDeleteEdit = {
  edit: "delete";
  id: string;
};

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
    case "skip":
      return undefined;
    case "clear":
      return { type: "clear" };
    case "assign":
      return { type: "assign", value: wrap(patch.value) };
  }
}

function wrapCreateUnitEdit(op: UnitCreateOp): RawUnitCreateEdit {
  return {
    edit: "create",
    local_id: op.localId,
    next_id: op.nextId,
    is_bubble: op.isBubble,
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
    case "create":
      return wrapCreateUnitEdit(op);
    case "patch":
      return wrapPatchUnitEdit(op);
    case "delete":
      return { edit: "delete", id: op.id };
  }
}

export function wrapUnitDiff(diff: UnitDiff): RawUnitEdit[] {
  return diff.ops.map(wrapUnitEdit);
}
