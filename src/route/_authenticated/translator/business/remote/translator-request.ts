import type { ApiClient } from "@/api/client";
import { searchChapterUnits as searchChapterUnitsApi } from "@/api/translator/unit-search";
import type { UnitTextPart as ApiUnitTextPart } from "@/api/translator/unit-search";
import {
  listPageUnits as listPageUnitsApi,
  savePageUnits as savePageUnitsApi,
  type UnitEditOperation,
  type UnitPatch as ApiUnitPatch,
  type UnitApiInfo,
} from "@/api/translator/unit";
import { transformChapterUnits as transformChapterUnitsApi } from "@/api/translator/unit-search";
import { UnitSaveProtocolError } from "@/route/_authenticated/translator/business/persistence/unit-save-merge";
import {
  modifyUnitIndex,
  type UnitInfo,
} from "@/route/_authenticated/translator/business/unit/unit";
import type {
  Patch,
  UnitDiff,
  UnitOp,
  UnitTranslation,
  UnitRevision,
} from "@/route/_authenticated/translator/business/contract/type";
import type { UnitSaveResult } from "@/route/_authenticated/translator/business/contract/type";
import type { Result } from "@/shared/utility/result";
import type {
  SearchUnitsArgs,
  TransformUnitsArgs,
  UnitSearchMatch,
} from "@/route/_authenticated/translator/business/contract/unit-search-transform";

export type ListPageUnitsResult = {
  units: UnitInfo[];
  totalUnitCount: number;
  translatedUnitCount: number;
  proofreadUnitCount: number;
};

function toApiPatch<Value>(patch: Patch<Value>): ApiUnitPatch<Value> | undefined {
  switch (patch.type) {
    case "skip":
      return undefined;
    case "clear":
    case "assign":
      return patch;
  }
}

function toApiUnitEdit(operation: UnitOp): UnitEditOperation {
  switch (operation.edit) {
    case "create":
      return operation;
    case "delete":
      return operation;
    case "patch":
      return {
        edit: "patch",
        id: operation.id,
        nextId: toApiPatch(operation.nextId),
        isBubble: operation.isBubble,
        isFlagged: operation.isFlagged,
        coord: operation.coord,
        translation: toApiPatch<UnitTranslation>(operation.translation),
        revision: toApiPatch<UnitRevision>(operation.revision),
      };
  }
}

function toUnitInfo(value: UnitApiInfo, index: number): UnitInfo {
  return modifyUnitIndex(
    {
      id: value.id,
      index: 0,
      xCoord: value.xCoord,
      yCoord: value.yCoord,
      isBubble: value.isBubble,
      isFlagged: value.isFlagged,
      translatedText: value.translatedText ?? undefined,
      translatorId: value.lastTranslatorId ?? undefined,
      isProofread: value.isProofread,
      proofreadText: value.proofreadText ?? undefined,
      proofreaderId: value.lastProofreaderId ?? undefined,
    },
    index,
  );
}

export async function listUnits(
  client: ApiClient,
  pageId: string,
): Promise<Result<ListPageUnitsResult>> {
  const result = await listPageUnitsApi(client, pageId, { timeoutMs: 30_000 });
  if (!result.success) return result;
  const units = result.data.unitInfos ?? [];
  return {
    success: true,
    data: {
      units: units.map(toUnitInfo),
      totalUnitCount: result.data.totalUnitCount,
      translatedUnitCount: result.data.translatedUnitCount,
      proofreadUnitCount: result.data.proofreadUnitCount,
    },
  };
}

export async function saveUnits(
  client: ApiClient,
  pageId: string,
  diff: UnitDiff,
  saveId: string,
): Promise<Result<UnitSaveResult>> {
  const result = await savePageUnitsApi(client, pageId, diff.ops.map(toApiUnitEdit), saveId, {
    timeoutMs: 30_000,
  });
  if (!result.success && result.failureKind === "protocol") {
    throw new UnitSaveProtocolError(result.error);
  }
  return result;
}

function toApiUnitTextPart(part: SearchUnitsArgs["part"]): ApiUnitTextPart {
  return part === "translatedText" ? "translated_text" : "proofread_text";
}

export async function searchChapterUnits(
  client: ApiClient,
  chapterId: string,
  args: SearchUnitsArgs,
): Promise<Result<UnitSearchMatch[]>> {
  const result = await searchChapterUnitsApi(client, chapterId, {
    part: toApiUnitTextPart(args.part),
    phrase: args.phrase,
  });
  if (!result.success) return result;
  return {
    success: true,
    data: result.data.map(({ pageId, unit }) => ({
      pageId,
      unit: toUnitInfo(unit, 0),
    })),
  };
}

export function transformChapterUnits(
  client: ApiClient,
  chapterId: string,
  args: TransformUnitsArgs,
): Promise<Result<undefined>> {
  return transformChapterUnitsApi(client, chapterId, {
    part: toApiUnitTextPart(args.part),
    units: args.unitIds.map((unitId) => ({
      unitId,
      transforms: [{ origin: args.origin, target: args.target }],
    })),
  });
}
