import { api } from "@/api/util";
import type { UnitInfo, UnitPatch, UnitCreation } from "@/types/unit";
import type { PageInfo } from "@/types/page";
import type { Result } from "@/types/utils/result";
import type { RawPageInfo } from "@/types/raw/page";
import { unwrapRawPageInfo } from "@/types/raw/page";
import {
  unwrapRawUnitInfo,
  wrapUnitCreation,
  wrapUnitPatch,
  type RawUnitInfo,
  type RawUnitCreation,
  type RawUnitPatch,
} from "@/types/raw/unit";

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

export async function createUnits(
  pageId: string,
  units: UnitCreation[],
): Promise<Result<void>> {
  if (units.length === 0) return { success: true, data: undefined };

  const rawUnits: RawUnitCreation[] = units.map(wrapUnitCreation);
  const res = await api.post<void, { page_id: string; units: RawUnitCreation[] }>(
    "/units",
    { page_id: pageId, units: rawUnits },
  );
  if (!res.success) return res;
  return { success: true, data: undefined };
}

export async function patchUnits(
  patches: UnitPatch[],
): Promise<Result<void>> {
  if (patches.length === 0) return { success: true, data: undefined };

  const rawPatches: RawUnitPatch[] = patches.map(wrapUnitPatch);
  const res = await api.patch<void, { units: RawUnitPatch[] }>(
    "/units",
    { units: rawPatches },
  );
  if (!res.success) return res;
  return { success: true, data: undefined };
}

export async function deleteUnits(
  unitIds: string[],
): Promise<Result<void>> {
  if (unitIds.length === 0) return { success: true, data: undefined };

  const res = await api.post<void, { unit_ids: string[] }>(
    "/units/delete",
    { unit_ids: unitIds },
  );
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
