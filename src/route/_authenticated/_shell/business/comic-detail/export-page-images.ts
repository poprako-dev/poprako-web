import type { ChapterExports } from "@/route/_authenticated/business/chapter/chapter-input";
import type { PageInfo } from "@/route/_authenticated/business/page/page";
import type { ExportContext } from "./comic-detail-export-types";
import type { ExportOutput } from "./export-output";
import { fetchExportImageWithRetry } from "./export-image-download";
import { resolveArchiveImageNames } from "./export-image-names";

async function mapExportPages<T, R>(items: T[], process: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  let next = 0;
  let failed = false;
  const worker = async (): Promise<void> => {
    try {
      while (!failed && next < items.length) {
        const index = next++;
        const item = items[index];
        if (item !== undefined) results[index] = await process(item);
      }
    } catch (error) {
      failed = true;
      throw error;
    }
  };
  const workers = await Promise.allSettled(Array.from({ length: 4 }, worker));
  const failure = workers.find((result) => result.status === "rejected");
  if (failure?.status === "rejected") throw failure.reason;
  return results;
}

type ExportPage = ChapterExports["poprako"]["pages"][number] & {
  sourceImageUrl: string;
  exportedImagePath: string | null;
};

async function exportPage(
  context: ExportContext,
  page: ChapterExports["poprako"]["pages"][number],
  total: number,
  output: ExportOutput,
  names: ReadonlyMap<string, string>,
  pageInfo: Map<string, PageInfo>,
): Promise<ExportPage> {
  context.assertNotAborted();
  const sourceImageUrl = pageInfo.get(page.pageId)?.imageUrl ?? "";
  const imageFile = sourceImageUrl
    ? await fetchExportImageWithRetry(sourceImageUrl, {
        client: context.client,
        signal: context.signal,
        assertNotAborted: context.assertNotAborted,
      })
    : null;
  context.assertNotAborted();
  const imageFileName = imageFile
    ? (names.get(page.pageId) ??
      `${String(page.pageIndex).padStart(3, "0")}.${imageFile.extension}`)
    : null;
  if (imageFile && imageFileName) await output.write(`images/${imageFileName}`, imageFile.blob);
  const completed = ++context.completedPages.value;
  context.updateProgress(
    "正在下载页面图片",
    `正在处理第 ${String(completed)} / ${String(total)} 页图片。`,
    20 + (completed / Math.max(total, 1)) * 60,
  );
  return {
    ...page,
    sourceImageUrl,
    exportedImagePath: imageFileName ? `images/${imageFileName}` : null,
  };
}

export async function addPageImages(
  context: ExportContext,
  data: ChapterExports,
  output: ExportOutput,
  withRawIdent: boolean,
): Promise<number> {
  const pageInfo = new Map(context.pages.map((page) => [page.id, page]));
  const rawIdentByPageId = new Map(data.rawIdents.map((item) => [item.pageId, item.rawIdent]));
  const names = withRawIdent
    ? resolveArchiveImageNames(
        data.poprako.pages.map((page) => ({
          pageId: page.pageId,
          defaultName: `${String(page.pageIndex).padStart(3, "0")}.${pageInfo.get(page.pageId)?.extension ?? "jpg"}`,
        })),
        rawIdentByPageId,
      )
    : new Map<string, string>();
  context.completedPages.value = 0;
  const pages = await mapExportPages(data.poprako.pages, (page) =>
    exportPage(context, page, data.poprako.pages.length, output, names, pageInfo),
  );
  const skippedImages = pages.filter(
    (page) => page.sourceImageUrl && !page.exportedImagePath,
  ).length;
  await output.write(
    "translation.prk.json",
    JSON.stringify(
      {
        ...data.poprako,
        exportedAt: new Date().toISOString(),
        skippedImageCount: skippedImages,
        pages: pages.map(({ sourceImageUrl: _sourceImageUrl, ...page }) => page),
      },
      null,
      2,
    ),
  );
  return skippedImages;
}
