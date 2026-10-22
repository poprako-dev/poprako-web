import type { ChapterWorkflowRecord } from "./workflow-contract";
import type { AssignmentResponse, ChapterResponse } from "@/api/content-contract";
import type { ApiClient } from "@/api/client";
import type { Result } from "@/shared/utility/result";

export type CreateChapterRequest = {
  comicId: string;
  subtitle?: string | undefined;
  presetAssignmentRoles?: number | undefined;
};
export type UpdateChapterStageRequest = {
  stage: "raw_provide" | "translate" | "proofread" | "typeset_redraw" | "review" | "publish";
  oper: "advance" | "revert";
};
export type ImportChapterRequest = {
  content: string;
  format: "poprako" | "label_plus";
  mode: "keep" | "overwrite";
};
export type ImportChapterResponse = {
  importedPageCount: number;
  importedUnitCount: number;
};

export function listChapters(
  client: ApiClient,
  comicId: string,
  args: {
    includes?: readonly string[] | undefined;
    offset: number;
    limit: number;
  },
): Promise<Result<ChapterResponse[]>> {
  return client.get<ChapterResponse[]>(`/comics/${comicId}/chapters`, {
    query: { incl: args.includes, offset: args.offset, limit: args.limit },
  });
}
export function getChapter(client: ApiClient, chapterId: string): Promise<Result<ChapterResponse>> {
  return client.get<ChapterResponse>(`/chapters/${chapterId}`);
}
export function getPinnedChapter(
  client: ApiClient,
  comicId: string,
): Promise<Result<ChapterResponse | null>> {
  return client.get<ChapterResponse | null>(`/comics/${comicId}/chapters/pinned`);
}
export function listChapterWorkflowRecords(
  client: ApiClient,
  chapterId: string,
  offset: number,
  limit: number,
): Promise<Result<ChapterWorkflowRecord[]>> {
  return client.get<ChapterWorkflowRecord[]>(`/chapters/${chapterId}/workflow-records`, {
    query: { offset, limit },
  });
}
export function createChapter(
  client: ApiClient,
  args: CreateChapterRequest,
): Promise<Result<{ id: string }>> {
  return client.post<{ id: string }>("/chapters", args);
}
export function updateChapter(
  client: ApiClient,
  id: string,
  args: { subtitle?: string | undefined },
): Promise<Result<undefined>> {
  return client.patch<undefined>(`/chapters/${id}`, { id, ...args });
}
export function markChapterPinned(client: ApiClient, id: string): Promise<Result<undefined>> {
  return client.post<undefined>(`/chapters/${id}/mark-pinned`, {});
}
export function transitionChapterStage(
  client: ApiClient,
  id: string,
  args: UpdateChapterStageRequest,
): Promise<Result<undefined>> {
  return client.post<undefined>(`/chapters/${id}/stage/advance`, { id, ...args });
}
export function deleteChapter(client: ApiClient, id: string): Promise<Result<undefined>> {
  return client.delete<undefined>(`/chapters/${id}`);
}
export function exportChapterText(
  client: ApiClient,
  id: string,
  args: {
    withRawIdent?: boolean | undefined;
    signal?: AbortSignal | undefined;
  } = {},
): Promise<Result<string>> {
  return client.getText(`/chapters/${id}/translations/export`, {
    query: {
      format: "poprako,label_plus",
      withRawIdent: args.withRawIdent ? true : undefined,
    },
    ...(args.signal ? { signal: args.signal } : {}),
  });
}
export function importChapter(
  client: ApiClient,
  id: string,
  args: ImportChapterRequest,
): Promise<Result<ImportChapterResponse>> {
  return client.post<ImportChapterResponse>(`/chapters/${id}/translations/import`, args);
}
export function joinChapter(
  client: ApiClient,
  chapterId: string,
  roles: number,
): Promise<Result<AssignmentResponse>> {
  return client.post<AssignmentResponse>("/assignments/join", { chapterId, roles });
}
