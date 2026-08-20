import { api } from "@/api/util";
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
  ImportChapterArgs,
  RawImportChapterArgs,
  ImportChapterResult,
  RawImportChapterResult,
  ListChapterWorkflowRecordsArgs,
} from "../types/chapter";

export type { ListChapterWorkflowRecordsArgs } from "../types/chapter";

type ExportRequestOptions = {
  signal?: AbortSignal;
};

function toStageUpdate(
  transition: UpdateChapterArgs["workflowTransition"] | UpdateChapterArgs["revertTransition"],
  oper: RawUpdateChapterStageArgs["oper"],
): Omit<RawUpdateChapterStageArgs, "id"> | null {
  if (!transition) return null;

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

  if (!res.success) return res;

  const items = Array.isArray(res.data) ? res.data : [];

  return { success: true, data: items.map((raw) => toChapterInfo(raw)!) };
}

export async function getChapter(id: string): Promise<Result<ChapterInfo>> {
  const res = await api.get<RawChapterInfo>(`/chapters/${id}`);
  if (!res.success) return res;

  const chapter = toChapterInfo(res.data);
  if (!chapter) {
    return { success: false, error: "章节数据无效" };
  }

  return { success: true, data: chapter };
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
  if (!res.success) return res;

  const items = Array.isArray(res.data) ? res.data : [];
  return { success: true, data: items.map(unwrapRawChapterWorkflowRecord) };
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
  if (!res.success) return res;
  return { success: true, data: (res.data as { id: string }).id };
}

export async function updateChapter(
  id: string,
  args: UpdateChapterArgs,
): Promise<Result<void>> {
  if (args.subtitle !== undefined) {
    const rawArgs: RawUpdateChapterArgs = {
      id,
      subtitle: args.subtitle,
    };

    const res = await api.patch<void, RawUpdateChapterArgs>(
      `/chapters/${id}`,
      rawArgs,
    );
    if (!res.success) return res;
  }

  if (args.isPinned) {
    const res = await api.post<void, object>(
      `/chapters/${id}/mark-pinned`,
      {},
    );
    if (!res.success) return res;
  }

  const stageUpdate =
    toStageUpdate(args.workflowTransition, "advance") ??
    toStageUpdate(args.revertTransition, "revert");
  if (stageUpdate) {
    const res = await api.post<void, RawUpdateChapterStageArgs>(
      `/chapters/${id}/stage/advance`,
      { id, ...stageUpdate },
    );
    if (!res.success) return res;
  }

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
  options?: ExportRequestOptions,
): Promise<Result<ChapterExport>> {
  const token = useAppStore.getState().getAccessToken();

  try {
    const response = await fetch(
      `${appConfig.apiBaseUrl}/chapters/${chapterId}/translations/export?format=poprako`,
      {
        method: "GET",
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : undefined,
        credentials: "omit",
        signal: options?.signal,
      },
    );

    const rawText = await response.text();

    if (!response.ok) {
      try {
        const body = JSON.parse(rawText) as { message?: string };
        return {
          success: false,
          error: body.message || response.statusText || "导出 PRK 失败",
        };
      } catch {
        return {
          success: false,
          error: rawText || response.statusText || "导出 PRK 失败",
        };
      }
    }

    const body = JSON.parse(rawText) as RawChapterExport;
    if (!body) {
      return { success: false, error: "导出 PRK 失败" };
    }

    return { success: true, data: unwrapRawChapterExport(body) };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "导出 PRK 失败",
    };
  }
}

export async function exportChapterLp(
  chapterId: string,
  options?: ExportRequestOptions,
): Promise<Result<string>> {
  const token = useAppStore.getState().getAccessToken();

  try {
    const response = await fetch(
      `${appConfig.apiBaseUrl}/chapters/${chapterId}/translations/export?format=label_plus`,
      {
      method: "GET",
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : undefined,
        credentials: "omit",
        signal: options?.signal,
      },
    );

    const rawText = await response.text();

    if (!response.ok) {
      try {
        const body = JSON.parse(rawText) as { message?: string };
        return {
          success: false,
          error: body.message || response.statusText || "导出 LP 失败",
        };
      } catch {
        return {
          success: false,
          error: rawText || response.statusText || "导出 LP 失败",
        };
      }
    }

    return { success: true, data: rawText };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "导出 LP 失败",
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
    chapter_id: args.chapterId,
    content: args.content,
    format: args.format === "json" ? "poprako" : "label_plus",
  };

  const res = await api.post<RawImportChapterResult, RawImportChapterArgs>(
    `/chapters/${args.chapterId}/translations/import`,
    rawArgs,
  );
  if (!res.success) return res;

  return {
    success: true,
    data: unwrapRawImportChapterResult(res.data as RawImportChapterResult),
  };
}

export async function joinChapter(
  chapterId: string,
  roleMask: number,
): Promise<Result<void>> {
  const res = await api.post<void, { chapter_id: string; roles: number }>(
    "/assignments/join",
    {
      chapter_id: chapterId,
      roles: roleMask,
    },
  );
  if (!res.success) return res;
  return { success: true, data: undefined };
}
