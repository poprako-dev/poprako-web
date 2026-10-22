import type { ApiClient } from "@/api/client";
import { exportChapterText } from "./chapter-api";
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
type ChapterExportResponse = Omit<ChapterExports, "rawIdents"> & {
  rawIdents?: ChapterExports["rawIdents"] | null | undefined;
};
export async function exportChapterData(
  client: ApiClient,
  id: string,
  options?: { signal?: AbortSignal | undefined; withRawIdent?: boolean | undefined },
): Promise<Result<ChapterExports>> {
  const result = await exportChapterText(client, id, options);
  if (!result.success) return result;
  try {
    const data = toCamelCase(JSON.parse(result.data) as unknown) as ChapterExportResponse;
    return { success: true, data: { ...data, rawIdents: data.rawIdents ?? [] } };
  } catch {
    return { success: false, error: "导出翻校数据响应不完整", failureKind: "protocol" };
  }
}
