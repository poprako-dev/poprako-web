import { UnitSaveProtocolError } from "@/features/BaseTranslator/hook/unitSaveMerge";
import { api } from "@/api/util";
import type { UnitInfo } from "@/types/unit";
import type { PageInfo, PageUnitDiffStats, PageUnitFlaggedStats } from "@/types/page";
import type { Result } from "@/types/utils/result";
import type { RawPageInfo, RawPageUnitDiffStats } from "@/types/raw/page";
import {
  unwrapRawPageInfo, unwrapRawPageUnitDiffStats, unwrapRawPageUnitFlaggedStats,
  type RawPageUnitFlaggedStats,
} from "@/types/raw/page";
import {
  unwrapRawUnitSearchMatch,
  unwrapRawListPageUnitsResult,
  wrapUnitDiff,
  type RawListPageUnitsResult,
  type RawTransformChapterUnitsArgs,
  type RawUnitEdit,
  type RawUnitInfo,
} from "@/types/raw/unit";
import type { UnitDiff, UnitSaveResult } from "@/features/BaseTranslator/types/type";
import type {
  TranslatorCompletionStage,
} from "@/features/BaseTranslator/types/access";
import type {
  SearchUnitsArgs,
  TransformUnitsArgs,
  UnitSearchMatch,
  UnitTextPart,
} from "@/features/BaseTranslator/types/unitSearchTransform";

export interface ListPageUnitsResult {
  units: UnitInfo[];
  totalUnitCount: number;
  translatedUnitCount: number;
  proofreadUnitCount: number;
}

export async function listUnits(
  pageId: string,
): Promise<Result<ListPageUnitsResult>> {
  const res = await api.get<RawListPageUnitsResult>(
    `/pages/${pageId}/units`, undefined, true, AbortSignal.timeout(30_000),
  );
  if (!res.success) {return res;}

  const data = unwrapRawListPageUnitsResult(res.data);
  return {
    success: true,
    data: {
      units: data.units,
      totalUnitCount: data.totalUnitCount,
      translatedUnitCount: data.translatedUnitCount,
      proofreadUnitCount: data.proofreadUnitCount,
    },
  };
}

export async function saveUnits(
  pageId: string,
  diff: UnitDiff,
  saveId: string,
): Promise<Result<UnitSaveResult>> {
  const result = await api.post<{
    created_unit_ids: { local_id: string; unit_id: string }[];
  } | undefined, RawUnitEdit[]>(
    `/pages/${pageId}/units/save`, wrapUnitDiff(diff), { save_id: saveId },
    true, AbortSignal.timeout(30_000),
  );
  if (!result.success) {return result;}
  if (!Array.isArray(result.data?.created_unit_ids)) {
    throw new UnitSaveProtocolError("保存响应缺少创建结果，请检查服务器协议");
  }
  return { success: true, data: {
    createdUnitIds: result.data.created_unit_ids.map((pair: unknown) => {
      if (typeof pair !== "object" || pair === null || !("local_id" in pair)
        || !("unit_id" in pair) || typeof pair.local_id !== "string"
        || typeof pair.unit_id !== "string") {
        throw new UnitSaveProtocolError("保存响应包含无效的创建结果");
      }
      return { localId: pair.local_id, unitId: pair.unit_id };
    }),
  } };
}

export async function listPages(
  chapterId: string,
): Promise<Result<PageInfo[]>> {
  const res = await api.get<RawPageInfo[]>(
    `/chapters/${chapterId}/pages`,
  );
  if (!res.success) {return res;}

  const items = Array.isArray(res.data) ? res.data : [];
  return { success: true, data: items.map((item) => unwrapRawPageInfo(item)) };
}

export async function listPageUnitFlaggedStats(
  chapterId: string,
): Promise<Result<PageUnitFlaggedStats[]>> {
  const result = await api.get<RawPageUnitFlaggedStats[]>(
    `/chapters/${chapterId}/pages/unit-flagged-stats`,
  );
  if (!result.success) {return result;}
  return { success: true, data: result.data.map((item) => unwrapRawPageUnitFlaggedStats(item)) };
}

export async function listPageUnitDiffStats(
  chapterId: string,
): Promise<Result<PageUnitDiffStats[]>> {
  const res = await api.get<RawPageUnitDiffStats[]>(
    `/chapters/${chapterId}/pages/unit-diff-stats`,
  );
  if (!res.success) {return res;}

  return { success: true, data: res.data.map((item) => unwrapRawPageUnitDiffStats(item)) };
}

export async function completeChapterStage(
  chapterId: string,
  stage: TranslatorCompletionStage,
): Promise<Result<undefined>> {
  const payload = {
    id: chapterId,
    stage,
    oper: "advance" as const,
  };

  return api.post<undefined, typeof payload>(
    `/chapters/${chapterId}/stage/advance`,
    payload,
  );
}

function wrapUnitTextPart(part: UnitTextPart) {
  return part === "translatedText" ? "translated_text" : "proofread_text";
}

export async function searchChapterUnits(
  chapterId: string,
  args: SearchUnitsArgs,
): Promise<Result<UnitSearchMatch[]>> {
  const result = await api.get<RawUnitInfo[]>(
    `/chapters/${chapterId}/units/search`,
    {
      part: wrapUnitTextPart(args.part),
      phrase: args.phrase,
    },
  );
  if (!result.success) {return result;}

  return {
    success: true,
    data: result.data.map((item) => unwrapRawUnitSearchMatch(item)),
  };
}

export async function transformChapterUnits(
  chapterId: string,
  args: TransformUnitsArgs,
): Promise<Result<undefined>> {
  const payload: RawTransformChapterUnitsArgs = {
    part: wrapUnitTextPart(args.part),
    units: args.unitIds.map((unitId) => ({
      unit_id: unitId,
      transforms: [{ origin: args.origin, target: args.target }],
    })),
  };

  return api.post<undefined, RawTransformChapterUnitsArgs>(
    `/chapters/${chapterId}/units/transform`,
    payload,
  );
}
