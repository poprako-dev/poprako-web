import {
  api,
  createHttpFailure,
  resolveHttpErrorMessage,
} from "@/api/util";
import { appConfig } from "@/config/config";
import { useAppStore } from "@/store/app";
import { toChapterInfo } from "@/types/chapter";
import type { ChapterInfo } from "@/types/chapter";
import type { ChapterWorkflowRecord } from "@/types/chapterWorkflowRecord";
import type { Result } from "@/types/utils/result";
import type { RawChapterInfo } from "@/types/raw/chapter";
import {
  unwrapRawChapterWorkflowRecord,
  type RawChapterWorkflowRecord,
} from "@/types/raw/chapterWorkflowRecord";
import type {
  ListChapterArgs,
  RawListChapterArgs,
  CreateChapterArgs,
  RawCreateChapterArgs,
  UpdateChapterArgs,
  RawUpdateChapterArgs,
  RawUpdateChapterStageArgs,
  ChapterExport,
  RawChapterExport,
  ChapterExports,
  RawChapterExports,
  ImportChapterArgs,
  RawImportChapterArgs,
  ImportChapterResult,
  RawImportChapterResult,
  ListChapterWorkflowRecordsArgs,
} from "../types/chapter";

export type { ListChapterWorkflowRecordsArgs } from "../types/chapter";

interface ExportRequestOptions {
  signal?: AbortSignal | undefined;
  withRawIdent?: boolean | undefined;
}

function toStageUpdate(
  transition: UpdateChapterArgs["workflowTransition"]  ,
  oper: RawUpdateChapterStageArgs["oper"],
): Omit<RawUpdateChapterStageArgs, "id"> | null {
  if (!transition) {return null;}

  if (transition.startsWith("upload_")) {
    return { stage: "raw_provide", oper };
  }
  if (transition.startsWith("translate_")) {
    return { stage: "translate", oper };
  }
  if (transition.startsWith("proofread_")) {
    return { stage: "proofread", oper };
  }
  if (transition.startsWith("typeset_")) {
    return { stage: "typeset_redraw", oper };
  }
  if (transition.startsWith("review_")) {
    return { stage: "review", oper };
  }
  if (transition.startsWith("publish_")) {
    return { stage: "publish", oper };
  }

  return null;
}

export async function listChapters(
  args: ListChapterArgs,
): Promise<Result<ChapterInfo[]>> {
  const rawArgs: RawListChapterArgs = {
    comic_id: args.comicId,
    incl: args.includes,
    offset: args.offset,
    limit: args.limit,
  };

  const res = await api.get<RawChapterInfo[]>(
    `/comics/${args.comicId}/chapters`,
    {
      incl: rawArgs.incl,
      offset: rawArgs.offset,
      limit: rawArgs.limit,
    },
  );

  if (!res.success) {return res;}

  const items = Array.isArray(res.data) ? res.data : [];

  return { success: true, data: items.flatMap((raw) => {
    const chapter = toChapterInfo(raw);
    return chapter ? [chapter] : [];
  }) };
}

export async function getChapter(id: string): Promise<Result<ChapterInfo>> {
  const res = await api.get<RawChapterInfo>(`/chapters/${id}`);
  if (!res.success) {return res;}

  const chapter = toChapterInfo(res.data);
  if (!chapter) {
    return { success: false, error: "章节数据无效" };
  }

  return { success: true, data: chapter };
}

export async function getPinnedChapter(comicId: string): Promise<Result<ChapterInfo | null>> {
  const result = await api.get<RawChapterInfo | null>(`/comics/${comicId}/chapters/pinned`);
  if (!result.success) {return result;}
  return { success: true, data: toChapterInfo(result.data ?? undefined) ?? null };
}

export async function listChapterWorkflowRecords(
  args: ListChapterWorkflowRecordsArgs,
): Promise<Result<ChapterWorkflowRecord[]>> {
  const res = await api.get<RawChapterWorkflowRecord[]>(
    `/chapters/${args.chapterId}/workflow-records`,
    {
      offset: args.offset,
      limit: args.limit,
    },
  );
  if (!res.success) {return res;}

  const items = Array.isArray(res.data) ? res.data : [];
  return { success: true, data: items.map((item) => unwrapRawChapterWorkflowRecord(item)) };
}

export async function createChapter(
  args: CreateChapterArgs,
): Promise<Result<string>> {
  const rawArgs: RawCreateChapterArgs = {
    comic_id: args.comicId,
    subtitle: args.subtitle,
    preset_assignment_roles: args.presetAssignmentRoles,
  };

  const res = await api.post<{ id: string }, RawCreateChapterArgs>(
    "/chapters",
    rawArgs,
  );
  if (!res.success) {return res;}
  return { success: true, data: (res.data).id };
}

export async function updateChapter(
  id: string,
  args: UpdateChapterArgs,
): Promise<Result<undefined>> {
  if (args.subtitle !== undefined) {
    const rawArgs: RawUpdateChapterArgs = {
      id,
      subtitle: args.subtitle,
    };

    const res = await api.patch<undefined, RawUpdateChapterArgs>(
      `/chapters/${id}`,
      rawArgs,
    );
    if (!res.success) {return res;}
  }

  if (args.isPinned) {
    const res = await api.post<undefined, object>(
      `/chapters/${id}/mark-pinned`,
      {},
    );
    if (!res.success) {return res;}
  }

  const stageUpdate =
    toStageUpdate(args.workflowTransition, "advance") ??
    toStageUpdate(args.revertTransition, "revert");
  if (stageUpdate) {
    const res = await api.post<undefined, RawUpdateChapterStageArgs>(
      `/chapters/${id}/stage/advance`,
      { id, ...stageUpdate },
    );
    if (!res.success) {return res;}
  }

  return { success: true, data: undefined };
}

export async function deleteChapter(id: string): Promise<Result<undefined>> {
  const res = await api.delete<undefined>(`/chapters/${id}`);
  if (!res.success) {return res;}
  return { success: true, data: undefined };
}

function unwrapRawChapterExport(raw: RawChapterExport): ChapterExport {
  return {
    comicId: raw.comic_id,
    comicTitle: raw.comic_title,
    chapterId: raw.chapter_id,
    chapterIndex: raw.chapter_index,
    chapterSubtitle: raw.chapter_subtitle,
    pages: raw.pages.map((page) => ({
      pageId: page.page_id,
      pageIndex: page.page_index,
      units: page.units.map((unit) => ({
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
  options?: ExportRequestOptions,
): Promise<Result<ChapterExports>> {
  const token = useAppStore.getState().getAccessToken();

  try {
    const rawIdentQuery = options?.withRawIdent ? "&with_raw_ident=true" : "";
    const response = await fetch(
      `${appConfig.apiBaseUrl}/chapters/${chapterId}/translations/export` +
        `?format=poprako,label_plus${rawIdentQuery}`,
      {
        ...(token && { headers: { Authorization: `Bearer ${token}` } }),
        credentials: "omit",
        ...(options?.signal && { signal: options.signal }),
      },
    );

    const rawText = await response.text();

    if (!response.ok) {
      let error: string;
      try {
        const body = JSON.parse(rawText) as { message?: string | undefined };
        error = resolveHttpErrorMessage(
          body.message,
          response.statusText,
          response.status,
        );
      } catch {
        error = rawText || response.statusText || "导出翻校数据失败";
      }
      return createHttpFailure(error, response.status);
    }

    const body = JSON.parse(rawText) as RawChapterExports;
    if (!body.poprako || body.label_plus === null) {
      return { success: false, error: "导出翻校数据响应不完整" };
    }

    return {
      success: true,
      data: {
        labelPlus: body.label_plus,
        poprako: unwrapRawChapterExport(body.poprako),
        rawIdents: (body.raw_idents ?? []).map((item) => ({
          pageId: item.page_id,
          rawIdent: item.raw_ident,
        })),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "导出翻校数据失败",
    };
  }
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
    content: args.content,
    format: args.format === "json" ? "poprako" : "label_plus",
    mode: args.mode,
  };

  const res = await api.post<RawImportChapterResult, RawImportChapterArgs>(
    `/chapters/${args.chapterId}/translations/import`,
    rawArgs,
  );
  if (!res.success) {return res;}

  return {
    success: true,
    data: unwrapRawImportChapterResult(res.data),
  };
}

export async function joinChapter(
  chapterId: string,
  roleMask: number,
): Promise<Result<undefined>> {
  const res = await api.post<undefined, { chapter_id: string; roles: number }>(
    "/assignments/join",
    {
      chapter_id: chapterId,
      roles: roleMask,
    },
  );
  if (!res.success) {return res;}
  return { success: true, data: undefined };
}
