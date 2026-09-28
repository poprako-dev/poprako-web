import type { ApiClient } from "@/api/client";
import * as chapterApi from "@/api/chapter/chapter-api";
import { exportChapterData } from "@/api/chapter/chapter-export";
import type { UpdateChapterStageRequest } from "@/api/chapter/chapter-api";
import type { ChapterInfo } from "./chapter";
import { toChapterInfo } from "../content-adapter";
import type { ChapterWorkflowRecord } from "./chapter-workflow-record";
import type { Result } from "@/shared/utility/result";
import type {
  ChapterExports,
  CreateChapterArgs,
  ImportChapterArgs,
  ImportChapterResult,
  ListChapterArgs,
  ListChapterWorkflowRecordsArgs,
  UpdateChapterArgs,
} from "./chapter-input";
export type { ListChapterWorkflowRecordsArgs } from "./chapter-input";
function toStageUpdate(
  transition: UpdateChapterArgs["workflowTransition"],
  oper: UpdateChapterStageRequest["oper"],
): UpdateChapterStageRequest | null {
  if (!transition) {
    return null;
  }

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

export function completeChapterStage(
  client: ApiClient,
  id: string,
  args: UpdateChapterStageRequest,
): Promise<Result<undefined>> {
  return chapterApi.transitionChapterStage(client, id, args);
}
export async function listChapters(
  client: ApiClient,
  args: ListChapterArgs,
): Promise<Result<ChapterInfo[]>> {
  const result = await chapterApi.listChapters(client, args.comicId, args);
  return result.success ? { success: true, data: result.data.map(toChapterInfo) } : result;
}
export async function getChapter(client: ApiClient, id: string): Promise<Result<ChapterInfo>> {
  const result = await chapterApi.getChapter(client, id);
  return result.success ? { success: true, data: toChapterInfo(result.data) } : result;
}
export async function getPinnedChapter(
  client: ApiClient,
  comicId: string,
): Promise<Result<ChapterInfo | null>> {
  const result = await chapterApi.getPinnedChapter(client, comicId);
  return result.success
    ? { success: true, data: result.data ? toChapterInfo(result.data) : null }
    : result;
}
export function listChapterWorkflowRecords(
  client: ApiClient,
  args: ListChapterWorkflowRecordsArgs,
): Promise<Result<ChapterWorkflowRecord[]>> {
  return chapterApi.listChapterWorkflowRecords(client, args.chapterId, args.offset, args.limit);
}
export async function createChapter(
  client: ApiClient,
  args: CreateChapterArgs,
): Promise<Result<string>> {
  const result = await chapterApi.createChapter(client, args);
  return result.success ? { success: true, data: result.data.id } : result;
}
export async function updateChapter(
  client: ApiClient,
  id: string,
  args: UpdateChapterArgs,
): Promise<Result<undefined>> {
  if (args.subtitle !== undefined) {
    const result = await chapterApi.updateChapter(client, id, { subtitle: args.subtitle });
    if (!result.success) return result;
  }
  if (args.isPinned) {
    const result = await chapterApi.markChapterPinned(client, id);
    if (!result.success) return result;
  }
  const transition =
    toStageUpdate(args.workflowTransition, "advance") ??
    toStageUpdate(args.revertTransition, "revert");
  return transition
    ? chapterApi.transitionChapterStage(client, id, transition)
    : { success: true, data: undefined };
}
export function deleteChapter(client: ApiClient, id: string): Promise<Result<undefined>> {
  return chapterApi.deleteChapter(client, id);
}
export function exportChapter(
  client: ApiClient,
  id: string,
  options?: { signal?: AbortSignal | undefined; withRawIdent?: boolean | undefined },
): Promise<Result<ChapterExports>> {
  return exportChapterData(client, id, options);
}
export function importChapter(
  client: ApiClient,
  args: ImportChapterArgs,
): Promise<Result<ImportChapterResult>> {
  return chapterApi.importChapter(client, args.chapterId, {
    content: args.content,
    format: args.format === "json" ? "poprako" : "label_plus",
    mode: args.mode,
  });
}
export function joinChapter(
  client: ApiClient,
  chapterId: string,
  roles: number,
): Promise<Result<undefined>> {
  return chapterApi.joinChapter(client, chapterId, roles);
}
