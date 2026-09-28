import {
  decodeArray,
  decodeBoolean,
  decodeNullable,
  decodeNumber,
  decodeObject,
  decodeString,
} from "@/api/contract";
import type { ApiClient } from "@/api/client";
import type { Result } from "@/shared/utility/result";

export type UnitApiInfo = {
  id: string;
  pageId: string;
  xCoord: number;
  yCoord: number;
  isBubble: boolean;
  isFlagged: boolean;
  translatedText?: string | null | undefined;
  lastTranslatorId?: string | null | undefined;
  isProofread: boolean;
  proofreadText?: string | null | undefined;
  lastProofreaderId?: string | null | undefined;
  createdAt: number;
  updatedAt: number;
};

export type ListPageUnitsResponse = {
  totalUnitCount: number;
  translatedUnitCount: number;
  proofreadUnitCount: number;
  unitInfos?: UnitApiInfo[] | undefined;
};

export type UnitPatch<Value> = Value | null;
export type UnitCoord = { xCoord: number; yCoord: number };
export type UnitTranslation = { translatedText: string };
export type UnitRevision = { isProofread: boolean; proofreadText?: string | undefined };

export type CreateUnitEdit = {
  edit: "create";
  localId: string;
  nextId?: string | null | undefined;
  isBubble: boolean;
  isFlagged: boolean;
  coord: UnitCoord;
  translation?: UnitTranslation | null | undefined;
  revision?: UnitRevision | null | undefined;
};

export type PatchUnitEdit = {
  edit: "patch";
  id: string;
  nextId?: UnitPatch<string> | undefined;
  isBubble?: boolean | undefined;
  isFlagged?: boolean | undefined;
  coord?: UnitCoord | undefined;
  translation?: UnitPatch<UnitTranslation> | undefined;
  revision?: UnitPatch<UnitRevision> | undefined;
};

export type DeleteUnitEdit = { edit: "delete"; id: string };
export type UnitEditOperation = CreateUnitEdit | PatchUnitEdit | DeleteUnitEdit;
export type CreatedUnitId = { localId: string; unitId: string };
export type SavePageUnitsResponse = { createdUnitIds: CreatedUnitId[] };

function optionalString(record: Record<string, unknown>, key: string): string | null | undefined {
  return key in record
    ? decodeNullable(record[key], (item) => decodeString(item, key), key)
    : undefined;
}

export function decodeUnitApiInfo(value: unknown): UnitApiInfo {
  const record = decodeObject(value, "unit");
  return {
    id: decodeString(record["id"], "unit.id"),
    pageId: decodeString(record["pageId"], "unit.pageId"),
    xCoord: decodeNumber(record["xCoord"], "unit.xCoord"),
    yCoord: decodeNumber(record["yCoord"], "unit.yCoord"),
    isBubble: decodeBoolean(record["isBubble"], "unit.isBubble"),
    isFlagged: decodeBoolean(record["isFlagged"], "unit.isFlagged"),
    translatedText: optionalString(record, "translatedText"),
    lastTranslatorId: optionalString(record, "lastTranslatorId"),
    isProofread: decodeBoolean(record["isProofread"], "unit.isProofread"),
    proofreadText: optionalString(record, "proofreadText"),
    lastProofreaderId: optionalString(record, "lastProofreaderId"),
    createdAt: decodeNumber(record["createdAt"], "unit.createdAt"),
    updatedAt: decodeNumber(record["updatedAt"], "unit.updatedAt"),
  };
}

function decodeListPageUnits(value: unknown): ListPageUnitsResponse {
  const record = decodeObject(value, "page units");
  return {
    totalUnitCount: decodeNumber(record["totalUnitCount"], "totalUnitCount"),
    translatedUnitCount: decodeNumber(record["translatedUnitCount"], "translatedUnitCount"),
    proofreadUnitCount: decodeNumber(record["proofreadUnitCount"], "proofreadUnitCount"),
    unitInfos:
      record["unitInfos"] === undefined
        ? undefined
        : decodeArray(record["unitInfos"], decodeUnitApiInfo, "unitInfos"),
  };
}

function decodeCreatedUnitId(value: unknown): CreatedUnitId {
  const record = decodeObject(value, "created unit id");
  return {
    localId: decodeString(record["localId"], "createdUnitId.localId"),
    unitId: decodeString(record["unitId"], "createdUnitId.unitId"),
  };
}

function decodeSavePageUnits(value: unknown): SavePageUnitsResponse {
  const record = decodeObject(value, "save page units");
  return {
    createdUnitIds: decodeArray(record["createdUnitIds"], decodeCreatedUnitId, "createdUnitIds"),
  };
}

export function listPageUnits(
  client: ApiClient,
  pageId: string,
  options: { signal?: AbortSignal | undefined; timeoutMs?: number | undefined } = {},
): Promise<Result<ListPageUnitsResponse>> {
  return client.get(`/pages/${pageId}/units`, {
    decode: decodeListPageUnits,
    timeoutMs: options.timeoutMs,
    signal: options.signal,
  });
}

export function savePageUnits(
  client: ApiClient,
  pageId: string,
  edits: readonly UnitEditOperation[],
  saveId: string,
  options: { signal?: AbortSignal | undefined; timeoutMs?: number | undefined } = {},
): Promise<Result<SavePageUnitsResponse>> {
  return client.post(`/pages/${pageId}/units/save`, edits, {
    query: { saveId },
    decode: decodeSavePageUnits,
    timeoutMs: options.timeoutMs,
    signal: options.signal,
  });
}
