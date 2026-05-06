import { api } from "@/api/util";
import { toChapterInfo } from "@/types/chapter";
import type { ChapterInfo } from "@/types/chapter";
import type { Result } from "@/types/utils/result";
import type { RawChapterInfo } from "@/types/raw/chapter";
import type {
  ListChapterArgs,
  RawListChapterArgs,
  CreateChapterArgs,
  RawCreateChapterArgs,
  UpdateChapterArgs,
  RawUpdateChapterArgs,
  ChapterExport,
  RawChapterExport,
  ImportChapterArgs,
  RawImportChapterArgs,
  ImportChapterResult,
  RawImportChapterResult,
} from "../types/chapter";

export async function listChapters(
  args: ListChapterArgs,
): Promise<Result<ChapterInfo[]>> {
  const rawArgs: RawListChapterArgs = {
    comic_id: args.comicId,
    includes: args.includes,
    offset: args.offset,
    limit: args.limit,
  };

  const res = await api.get<RawChapterInfo[]>("/chapters", rawArgs);

  if (!res.success) return res;

  const items = Array.isArray(res.data) ? res.data : [];

  return { success: true, data: items.map((raw) => toChapterInfo(raw)!) };
}

export async function getPinnedChapter(
  comicId: string,
): Promise<Result<ChapterInfo>> {
  const res = await api.get<RawChapterInfo>("/chapters/pinned", {
    comic_id: comicId,
  });
  if (!res.success) return res;

  const chapter = toChapterInfo(res.data);
  if (!chapter) {
    return { success: false, error: "未找到置顶章节" };
  }

  return { success: true, data: chapter };
}

export async function createChapter(
  args: CreateChapterArgs,
): Promise<Result<string>> {
  const rawArgs: RawCreateChapterArgs = {
    comic_id: args.comicId,
    subtitle: args.subtitle,
  };

  const res = await api.post<{ id: string }, RawCreateChapterArgs>(
    "/chapters",
    rawArgs,
  );
  if (!res.success) return res;
  return { success: true, data: (res.data as { id: string }).id };
}

export async function updateChapter(
  id: string,
  args: UpdateChapterArgs,
): Promise<Result<void>> {
  const rawArgs: RawUpdateChapterArgs = {
    chapter_id: id,
    subtitle: args.subtitle,
    is_pinned: args.isPinned,
    workflow_transition: args.workflowTransition,
  };

  const res = await api.put<void, RawUpdateChapterArgs>(
    `/chapters/${id}`,
    rawArgs,
  );
  if (!res.success) return res;
  return { success: true, data: undefined };
}

export async function deleteChapter(id: string): Promise<Result<void>> {
  const res = await api.delete<void>(`/chapters/${id}`);
  if (!res.success) return res;
  return { success: true, data: undefined };
}

function unwrapRawChapterExport(raw: RawChapterExport): ChapterExport {
  return {
    comicId: raw.comic_id,
    comicTitle: raw.comic_title,
    chapterId: raw.chapter_id,
    chapterIndex: raw.chapter_index,
    chapterSubtitle: raw.chapter_subtitle,
    pages: (raw.pages ?? []).map((page) => ({
      pageId: page.page_id,
      pageIndex: page.page_index,
      imageUrl: page.image_url,
      isUploaded: page.is_uploaded,
      units: (page.units ?? []).map((unit) => ({
        unitId: unit.unit_id,
        unitIndex: unit.unit_index,
        pageId: unit.page_id,
        pageIndex: unit.page_index,
        translatedText: unit.translated_text,
        proofreadText: unit.proofread_text,
        translatorId: unit.translator_id,
        proofreaderId: unit.proofreader_id,
        translatorComment: unit.translator_comment,
        proofreaderComment: unit.proofreader_comment,
        xCoord: unit.x_coord,
        yCoord: unit.y_coord,
        isBubble: unit.is_bubble,
        isProofread: unit.is_proofread,
      })),
    })),
  };
}

export async function exportChapter(
  chapterId: string,
): Promise<Result<ChapterExport>> {
  const res = await api.get<RawChapterExport>(`/chapters/${chapterId}/export`);
  if (!res.success) return res;
  return { success: true, data: unwrapRawChapterExport(res.data) };
}

function unwrapRawImportChapterResult(
  raw: RawImportChapterResult,
): ImportChapterResult {
  return {
    importedPageCount: raw.imported_page_count,
    importedUnitCount: raw.imported_unit_count,
  };
}

export async function importChapter(
  args: ImportChapterArgs,
): Promise<Result<ImportChapterResult>> {
  const rawArgs: RawImportChapterArgs = {
    chapter_id: args.chapterId,
    content: args.content,
    format: args.format,
  };

  const res = await api.post<RawImportChapterResult, RawImportChapterArgs>(
    `/chapters/${args.chapterId}/import`,
    rawArgs,
  );
  if (!res.success) return res;

  return {
    success: true,
    data: unwrapRawImportChapterResult(res.data as RawImportChapterResult),
  };
}
