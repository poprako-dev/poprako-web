import { api } from "@/api/util";
import type { UnitInfo } from "@/types/unit";
import type { PageInfo } from "@/types/page";
import type { Result } from "@/types/utils/result";
import type { RawPageInfo } from "@/types/raw/page";
import { unwrapRawPageInfo } from "@/types/raw/page";
import {
  unwrapRawListPageUnitsResult,
  wrapUnitDiff,
  type RawListPageUnitsResult,
  type RawUnitEdit,
} from "@/types/raw/unit";
import type { UnitDiff } from "@/features/BaseTranslator/types/type";
import type {
  TranslatorCompletionStage,
} from "@/features/BaseTranslator/types/access";

export type ListPageUnitsResult = {
  units: UnitInfo[];
  totalUnitCount: number;
  translatedUnitCount: number;
  proofreadUnitCount: number;
};

export async function listUnits(
  pageId: string,
): Promise<Result<ListPageUnitsResult>> {
  const res = await api.get<RawListPageUnitsResult>(
    `/pages/${pageId}/units`,
  );
  if (!res.success) return res;

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
): Promise<Result<void>> {
  const payload = wrapUnitDiff(diff);

  return api.post<void, RawUnitEdit[]>(
    `/pages/${pageId}/units/save`,
    payload,
  );
}

export async function listPages(
  chapterId: string,
): Promise<Result<PageInfo[]>> {
  const res = await api.get<RawPageInfo[]>(
    `/chapters/${chapterId}/pages`,
  );
  if (!res.success) return res;

  const items = Array.isArray(res.data) ? res.data : [];
  return { success: true, data: items.map(unwrapRawPageInfo) };
}

export async function completeChapterStage(
  chapterId: string,
  stage: TranslatorCompletionStage,
): Promise<Result<void>> {
  const payload = {
    id: chapterId,
    stage,
    oper: "advance" as const,
  };

  return api.post<void, typeof payload>(
    `/chapters/${chapterId}/stage/advance`,
    payload,
  );
}
