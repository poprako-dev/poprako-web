import { api } from "@/api/util";
import type { UnitInfo } from "@/types/unit";
import type { PageInfo } from "@/types/page";
import type { Result } from "@/types/utils/result";
import type { RawPageInfo } from "@/types/raw/page";
import { unwrapRawPageInfo } from "@/types/raw/page";
import {
  unwrapRawUnitInfo,
  wrapUnitCreation,
  wrapUnitPatch,
  type RawUnitInfo,
} from "@/types/raw/unit";
import type { UnitDiff } from "@/features/BaseTranslator/types/type";

export async function listUnits(pageId: string): Promise<Result<UnitInfo[]>> {
  const res = await api.get<RawUnitInfo[]>("/units", {
    page_id: pageId,
    offset: 0,
    limit: 500,
  });
  if (!res.success) return res;

  const items = Array.isArray(res.data) ? res.data : [];
  return { success: true, data: items.map(unwrapRawUnitInfo) };
}

export async function saveUnits(
  pageId: string,
  diff: UnitDiff,
): Promise<Result<void>> {
  const payload = {
    page_id: pageId,
    unit_diff: {
      insert: diff.insert.map(wrapUnitCreation),
      patch: diff.patch.map(wrapUnitPatch),
      delete: diff.delete,
    },
  };

  const res = await api.put<void, typeof payload>("/units", payload);
  if (!res.success) return res;
  return { success: true, data: undefined };
}

export async function listPages(
  chapterId: string,
): Promise<Result<PageInfo[]>> {
  const res = await api.get<RawPageInfo[]>("/pages", {
    chapter_id: chapterId,
    offset: 0,
    limit: 500,
  });
  if (!res.success) return res;

  const items = Array.isArray(res.data) ? res.data : [];
  return { success: true, data: items.map(unwrapRawPageInfo) };
}
