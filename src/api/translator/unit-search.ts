import { decodeArray, decodeObject, decodeString, decodeVoid } from "@/api/contract";
import type { ApiClient } from "@/api/client";
import { decodeUnitApiInfo, type UnitApiInfo } from "@/api/translator/unit";
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

function decodeUnitSearchMatch(value: unknown): UnitSearchMatchResponse {
  const record = decodeObject(value, "unit search match");
  return {
    pageId: decodeString(record["pageId"], "pageId"),
    unit: decodeUnitApiInfo(record),
  };
}

export function searchChapterUnits(
  client: ApiClient,
  chapterId: string,
  query: { part: UnitTextPart; phrase: string },
): Promise<Result<UnitSearchMatchResponse[]>> {
  return client.get(`/chapters/${chapterId}/units/search`, {
    query,
    decode: (value) => decodeArray(value, decodeUnitSearchMatch, "unit search results"),
  });
}

export function transformChapterUnits(
  client: ApiClient,
  chapterId: string,
  body: TransformChapterUnitsBody,
): Promise<Result<undefined>> {
  return client.post(`/chapters/${chapterId}/units/transform`, body, {
    decode: decodeVoid,
  });
}
