import type { ChapterExports } from "@/route/_authenticated/business/chapter/chapter-input";
import { showLocalApiFailure } from "@/route/business/request-error";
import type { ExportContext, ExportOptions } from "./comic-detail-export-types";
import { createExportOutput, selectExportDirectory } from "./export-output";
import type { ExportOutput } from "./export-output";
import { addPageImages } from "./export-page-images";
import { buildAssignmentExportText, buildComicDetailExportName } from "./export-format";

function buildOutputName(context: ExportContext, includeImages: boolean): string {
  const name = buildComicDetailExportName({
    comicIndex: context.comicIndex,
    chapterIndex: context.selectedChapter?.index,
    author: context.comicAuthor,
    title: context.comicTitle,
    subtitle: context.selectedChapter?.subtitle,
  });
  return includeImages ? name : `${name}-翻校数据`;
}

async function writeExportFiles(
  context: ExportContext,
  data: ChapterExports,
  output: ExportOutput,
  options: ExportOptions,
): Promise<number> {
  const includeImages = options.includeImages ?? true;
  const skippedImages = includeImages
    ? await addPageImages(context, data, output, options.withRawIdent ?? false)
    : 0;
  context.assertNotAborted();
  context.updateProgress("正在保存文件", "正在保存翻校数据。", 85);
  if (!includeImages)
    await output.write(
      "translation.prk.json",
      JSON.stringify({ ...data.poprako, exportedAt: new Date().toISOString() }, null, 2),
    );
  await output.write("translation.lp.txt", data.labelPlus);
  await output.write("assignments.txt", buildAssignmentExportText(context.assignments));
  return skippedImages;
}

function showExportResult(context: ExportContext, skippedImages: number, directory: boolean): void {
  const message = directory ? "导出完成，文件已保存到章节文件夹" : "导出完成，ZIP 文件已开始下载";
  if (skippedImages > 0) {
    context.showToast(`${message}，${String(skippedImages)} 张图片下载失败后已跳过`, "error");
  } else context.showToast(message, "success");
}

export async function performComicDetailExport(
  context: ExportContext,
  options: ExportOptions,
): Promise<void> {
  if (!context.selectedChapterId || !context.onExportChapter) return;
  // Keep the picker before any request so it runs within the user's click gesture.
  const directory = await selectExportDirectory();
  context.assertNotAborted();
  context.updateProgress("正在读取翻校数据", "正在请求 PRK 与 LP 导出内容。", 10);
  const result = await context.onExportChapter(context.selectedChapterId, {
    signal: context.signal,
    withRawIdent: options.withRawIdent,
  });
  context.assertNotAborted();
  if (!result.success) {
    showLocalApiFailure(result, context.showToast);
    return;
  }
  context.onWorkflowRecordsChanged();
  const output = await createExportOutput(
    directory,
    buildOutputName(context, options.includeImages ?? true),
    context.signal,
    context.updateProgress,
  );
  const skippedImages = await writeExportFiles(context, result.data, output, options);
  await output.finish();
  context.assertNotAborted();
  showExportResult(context, skippedImages, directory !== null);
}
