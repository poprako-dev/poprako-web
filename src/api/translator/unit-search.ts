import type { ApiClient } from "@/api/client";
import type { UnitApiInfo } from "@/api/translator/unit";
import type { Result } from "@/shared/utility/result";

export type UnitTextPart = "translated_text" | "proofread_text";
export type UnitSearchMatchResponse = { pageId: string; unit: UnitApiInfo };
export type TransformChapterUnitsBody = {
  part: UnitTextPart;
  units: {
    unitId: string;
    transforms: { origin: string; target: string }[];
  }[];
};

export async function searchChapterUnits(
  client: ApiClient,
  chapterId: string,
  query: { part: UnitTextPart; phrase: string },
): Promise<Result<UnitSearchMatchResponse[]>> {
  const result = await client.get<UnitApiInfo[]>(`/chapters/${chapterId}/units/search`, {
    query,
  });
  if (!result.success) return result;
  return {
    success: true,
    data: result.data.map((unit) => ({ pageId: unit.pageId, unit })),
  };
}

export function transformChapterUnits(
  client: ApiClient,
  chapterId: string,
  body: TransformChapterUnitsBody,
): Promise<Result<undefined>> {
  return client.post<undefined>(`/chapters/${chapterId}/units/transform`, body);
}
