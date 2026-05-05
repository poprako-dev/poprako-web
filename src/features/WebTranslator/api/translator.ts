import { api } from "@/api/util";
import type { UnitInfo } from "@/types/unit";
import type { PageInfo } from "@/types/page";
import type { Result } from "@/types/utils/result";
import type { RawPageInfo } from "@/types/raw/page";
import { unwrapRawPageInfo } from "@/types/raw/page";
import {
  unwrapRawListPageUnitsResult,
  unwrapRawSavePageUnitsResult,
  wrapUnitDiff,
  type RawListPageUnitsResult,
  type RawSavePageUnitsResult,
  type SavePageUnitsResult,
} from "@/types/raw/unit";
import type { UnitDiff } from "@/features/BaseTranslator/types/type";

export type ListPageUnitsResult = {
  units: UnitInfo[];
  totalUnitCount: number;
  translatedUnitCount: number;
  proofreadUnitCount: number;
};

export async function listUnits(
  pageId: string,
): Promise<Result<ListPageUnitsResult>> {
  const res = await api.get<RawListPageUnitsResult>(`/pages/${pageId}/units`);
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
): Promise<Result<SavePageUnitsResult>> {
  const payload = {
    page_id: pageId,
    diff: wrapUnitDiff(pageId, diff),
  };

  const res = await api.post<RawSavePageUnitsResult, typeof payload>(
    `/pages/${pageId}/units`,
    payload,
  );
  if (!res.success) return res;

  return { success: true, data: unwrapRawSavePageUnitsResult(res.data) };
}

export async function listPages(
  chapterId: string,
): Promise<Result<PageInfo[]>> {
  const res = await api.get<RawPageInfo[]>(`/chapters/${chapterId}/pages`, {
    offset: 0,
    limit: 500,
  });
  if (!res.success) return res;

  const items = Array.isArray(res.data) ? res.data : [];
  return { success: true, data: items.map(unwrapRawPageInfo) };
}
