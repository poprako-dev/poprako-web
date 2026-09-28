import type { ApiClient } from "@/api/client";
import { exportChapterText } from "./chapter-api";
import {
  decodeArray,
  decodeBoolean,
  decodeNumber,
  decodeObject,
  decodeString,
} from "@/api/contract";
import { toCamelCase } from "@/shared/utility/case-convert";
import type { Result } from "@/shared/utility/result";

type ExportUnit = {
  unitId?: string | undefined;
  unitIndex?: number | undefined;
  pageId?: string | undefined;
  pageIndex?: number | undefined;
  translatedText?: string | undefined;
  proofreadText?: string | undefined;
  translatorId?: string | undefined;
  proofreaderId?: string | undefined;
  translatorComment?: string | undefined;
  proofreaderComment?: string | undefined;
  xCoord?: number | undefined;
  yCoord?: number | undefined;
  isBubble?: boolean | undefined;
  isProofread?: boolean | undefined;
};
type ExportPage = { pageId: string; pageIndex: number; units: ExportUnit[] };
export type ChapterExports = {
  labelPlus: string;
  poprako: {
    comicId: string;
    comicTitle: string;
    chapterId: string;
    chapterIndex: number;
    chapterSubtitle: string;
    pages: ExportPage[];
  };
  rawIdents: { pageId: string; rawIdent: string }[];
};
function decodeUnit(value: unknown): ExportUnit {
  const object = decodeObject(value, "export unit");
  const unit: ExportUnit = {};
  for (const key of [
    "unitId",
    "pageId",
    "translatedText",
    "proofreadText",
    "translatorId",
    "proofreaderId",
    "translatorComment",
    "proofreaderComment",
  ] as const) {
    const value = object[key];
    if (value !== null && value !== undefined) unit[key] = decodeString(value, key);
  }
  for (const key of ["unitIndex", "pageIndex", "xCoord", "yCoord"] as const) {
    const value = object[key];
    if (value !== null && value !== undefined) unit[key] = decodeNumber(value, key);
  }
  for (const key of ["isBubble", "isProofread"] as const) {
    const value = object[key];
    if (value !== null && value !== undefined) unit[key] = decodeBoolean(value, key);
  }
  return unit;
}
function decodeExport(value: unknown): ChapterExports {
  const object = decodeObject(value, "chapter export");
  const comic = decodeObject(object["poprako"], "poprako export");
  return {
    labelPlus: decodeString(object["labelPlus"], "labelPlus"),
    poprako: {
      comicId: decodeString(comic["comicId"], "comicId"),
      comicTitle: decodeString(comic["comicTitle"], "comicTitle"),
      chapterId: decodeString(comic["chapterId"], "chapterId"),
      chapterIndex: decodeNumber(comic["chapterIndex"], "chapterIndex"),
      chapterSubtitle: decodeString(comic["chapterSubtitle"], "chapterSubtitle"),
      pages: decodeArray(
        comic["pages"],
        (value) => {
          const page = decodeObject(value, "export page");
          return {
            pageId: decodeString(page["pageId"], "pageId"),
            pageIndex: decodeNumber(page["pageIndex"], "pageIndex"),
            units: decodeArray(page["units"], decodeUnit, "units"),
          };
        },
        "pages",
      ),
    },
    rawIdents: decodeArray(
      object["rawIdents"] ?? [],
      (value) => {
        const ident = decodeObject(value, "raw ident");
        return {
          pageId: decodeString(ident["pageId"], "pageId"),
          rawIdent: decodeString(ident["rawIdent"], "rawIdent"),
        };
      },
      "rawIdents",
    ),
  };
}
export async function exportChapterData(
  client: ApiClient,
  id: string,
  options?: { signal?: AbortSignal | undefined; withRawIdent?: boolean | undefined },
): Promise<Result<ChapterExports>> {
  const result = await exportChapterText(client, id, options);
  if (!result.success) return result;
  try {
    return { success: true, data: decodeExport(toCamelCase(JSON.parse(result.data) as unknown)) };
  } catch {
    return { success: false, error: "导出翻校数据响应不完整", failureKind: "protocol" };
  }
}
