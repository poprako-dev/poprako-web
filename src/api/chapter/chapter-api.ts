import type { ChapterWorkflowRecordEvent, ChapterWorkflowRecord } from "./workflow-contract";
import { decodeAssignment, decodeChapterResponse } from "@/api/content-contract";
import type { AssignmentResponse, ChapterResponse } from "@/api/content-contract";
import type { ApiClient } from "@/api/client";
import {
  decodeArray,
  decodeBoolean,
  decodeNullable,
  decodeNumber,
  decodeObject,
  decodeString,
  decodeVoid,
} from "@/api/contract";
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

function decodeEvent(value: unknown): ChapterWorkflowRecordEvent {
  const event = decodeObject(value, "workflow event");
  const kind = decodeString(event["kind"], "workflow event.kind");
  const data =
    event["data"] === undefined ? undefined : decodeObject(event["data"], "workflow event.data");
  return decodeEventData(kind, data);
}

function decodeEventData(
  kind: string,
  data: Record<string, unknown> | undefined,
): ChapterWorkflowRecordEvent {
  switch (kind) {
    case "chapter_created":
    case "chapter_pinned":
    case "chapter_unpinned":
      return { kind };
    case "chapter_subtitle_updated":
      return decodeSubtitleEvent(kind, data);
    case "assignment_created":
    case "assignment_roles_updated":
    case "assignment_deleted":
      return decodeAssignmentEvent(kind, data);
    case "translation_imported": {
      return decodeTranslationImport(kind, data);
    }
    case "translation_exported": {
      return decodeTranslationExport(kind, data);
    }
    case "artwork_exported":
      return { kind, data: { artworkVersion: eventNumber(data, kind, "artworkVersion") } };
    case "stage_transitioned": {
      return decodeStageTransition(kind, (key) => eventString(data, kind, key));
    }
    default:
      throw new Error(`Unsupported workflow event ${kind}`);
  }
}

function decodeSubtitleEvent(
  kind: string,
  data: Record<string, unknown> | undefined,
): ChapterWorkflowRecordEvent {
  return {
    kind: kind as "chapter_subtitle_updated",
    data: {
      previousSubtitle: eventString(data, kind, "previousSubtitle"),
      nextSubtitle: eventString(data, kind, "nextSubtitle"),
    },
  };
}

function decodeAssignmentEvent(
  kind: string,
  data: Record<string, unknown> | undefined,
): ChapterWorkflowRecordEvent {
  const subjectUserId = eventString(data, kind, "subjectUserId");
  if (kind === "assignment_created") {
    return {
      kind: "assignment_created" as const,
      data: { subjectUserId, roles: eventNumber(data, kind, "roles") },
    };
  }
  if (kind === "assignment_roles_updated") {
    return {
      kind: "assignment_roles_updated" as const,
      data: {
        subjectUserId,
        previousRoles: eventNumber(data, kind, "previousRoles"),
        nextRoles: eventNumber(data, kind, "nextRoles"),
      },
    };
  }
  return {
    kind: "assignment_deleted" as const,
    data: { subjectUserId, previousRoles: eventNumber(data, kind, "previousRoles") },
  };
}

function decodeTranslationImport(
  kind: string,
  data: Record<string, unknown> | undefined,
): ChapterWorkflowRecordEvent {
  const format = eventString(data, kind, "format");
  if (format !== "label_plus" && format !== "poprako") {
    throw new Error("Invalid workflow format");
  }
  return {
    kind: "translation_imported" as const,
    data: {
      format,
      importedPageCount: eventNumber(data, kind, "importedPageCount"),
      importedUnitCount: eventNumber(data, kind, "importedUnitCount"),
    },
  };
}

function decodeTranslationExport(
  kind: string,
  data: Record<string, unknown> | undefined,
): ChapterWorkflowRecordEvent {
  const formats = decodeObject(data?.["formats"], "workflow export formats");
  return {
    kind: "translation_exported" as const,
    data: {
      formats: {
        labelPlus: decodeBoolean(formats["labelPlus"], `workflow event.${kind}.labelPlus`),
        poprako: decodeBoolean(formats["poprako"], `workflow event.${kind}.poprako`),
      },
    },
  };
}

function eventString(data: Record<string, unknown> | undefined, kind: string, key: string): string {
  return decodeString(data?.[key], `workflow event.${kind}.${key}`);
}

function eventNumber(data: Record<string, unknown> | undefined, kind: string, key: string): number {
  return decodeNumber(data?.[key], `workflow event.${kind}.${key}`);
}

function decodeStageTransition(
  kind: string,
  string: (key: string) => string,
): ChapterWorkflowRecordEvent {
  const stage = string("stage");
  const previousPhase = string("previousPhase");
  const nextPhase = string("nextPhase");
  const origin = string("origin");
  if (
    !STAGES.includes(stage as UpdateChapterStageRequest["stage"]) ||
    !PHASES.includes(previousPhase as Phase) ||
    !PHASES.includes(nextPhase as Phase) ||
    !ORIGINS.includes(origin as Origin)
  ) {
    throw new Error("Invalid workflow stage transition");
  }
  return {
    kind: kind as "stage_transitioned",
    data: {
      stage: stage as UpdateChapterStageRequest["stage"],
      previousPhase: previousPhase as Phase,
      nextPhase: nextPhase as Phase,
      origin: origin as Origin,
    },
  };
}

type Phase = "pending" | "active" | "completed";
type Origin =
  | "manual"
  | "unit_edit"
  | "translation_import"
  | "translation_export"
  | "raw_provide_check"
  | "artwork_upload";
const STAGES: UpdateChapterStageRequest["stage"][] = [
  "raw_provide",
  "translate",
  "proofread",
  "typeset_redraw",
  "review",
  "publish",
];
const PHASES: Phase[] = ["pending", "active", "completed"];
const ORIGINS: Origin[] = [
  "manual",
  "unit_edit",
  "translation_import",
  "translation_export",
  "raw_provide_check",
  "artwork_upload",
];

function decodeWorkflowRecord(value: unknown): ChapterWorkflowRecord {
  const object = decodeObject(value, "workflow record");
  return {
    id: decodeString(object["id"], "workflow record.id"),
    chapterId: decodeString(object["chapterId"], "workflow record.chapterId"),
    actorUserId: decodeNullable(object["actorUserId"], (item) =>
      decodeString(item, "workflow record.actorUserId"),
    ),
    event: decodeEvent(object["event"]),
    createdAt: decodeNumber(object["createdAt"], "workflow record.createdAt"),
  };
}
function decodeId(value: unknown): { id: string } {
  const object = decodeObject(value, "chapter result");
  return { id: decodeString(object["id"], "chapter result.id") };
}
function decodeImport(value: unknown): ImportChapterResponse {
  const object = decodeObject(value, "chapter import result");
  return {
    importedPageCount: decodeNumber(object["importedPageCount"], "import result.importedPageCount"),
    importedUnitCount: decodeNumber(object["importedUnitCount"], "import result.importedUnitCount"),
  };
}

export function listChapters(
  client: ApiClient,
  comicId: string,
  args: {
    includes?: readonly string[] | undefined;
    offset: number;
    limit: number;
  },
): Promise<Result<ChapterResponse[]>> {
  return client.get(`/comics/${comicId}/chapters`, {
    query: { incl: args.includes, offset: args.offset, limit: args.limit },
    decode: (value) => decodeArray(value, decodeChapterResponse, "chapters"),
  });
}
export function getChapter(client: ApiClient, chapterId: string): Promise<Result<ChapterResponse>> {
  return client.get(`/chapters/${chapterId}`, {
    decode: decodeChapterResponse,
  });
}
export function getPinnedChapter(
  client: ApiClient,
  comicId: string,
): Promise<Result<ChapterResponse | null>> {
  return client.get(`/comics/${comicId}/chapters/pinned`, {
    decode: (value) => decodeNullable(value, decodeChapterResponse, "pinned chapter"),
  });
}
export function listChapterWorkflowRecords(
  client: ApiClient,
  chapterId: string,
  offset: number,
  limit: number,
): Promise<Result<ChapterWorkflowRecord[]>> {
  return client.get(`/chapters/${chapterId}/workflow-records`, {
    query: { offset, limit },
    decode: (value) => decodeArray(value, decodeWorkflowRecord, "workflow records"),
  });
}
export function createChapter(
  client: ApiClient,
  args: CreateChapterRequest,
): Promise<Result<{ id: string }>> {
  return client.post("/chapters", args, { decode: decodeId });
}
export function updateChapter(
  client: ApiClient,
  id: string,
  args: { subtitle?: string | undefined },
): Promise<Result<undefined>> {
  return client.patch(
    `/chapters/${id}`,
    { id, ...args },
    {
      decode: decodeVoid,
    },
  );
}
export function markChapterPinned(client: ApiClient, id: string): Promise<Result<undefined>> {
  return client.post(`/chapters/${id}/mark-pinned`, {}, { decode: decodeVoid });
}
export function transitionChapterStage(
  client: ApiClient,
  id: string,
  args: UpdateChapterStageRequest,
): Promise<Result<undefined>> {
  return client.post(
    `/chapters/${id}/stage/advance`,
    { id, ...args },
    {
      decode: decodeVoid,
    },
  );
}
export function deleteChapter(client: ApiClient, id: string): Promise<Result<undefined>> {
  return client.delete(`/chapters/${id}`, { decode: decodeVoid });
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
  return client.post(`/chapters/${id}/translations/import`, args, {
    decode: decodeImport,
  });
}
export function joinChapter(
  client: ApiClient,
  chapterId: string,
  roles: number,
): Promise<Result<AssignmentResponse>> {
  return client.post(
    "/assignments/join",
    { chapterId, roles },
    {
      decode: decodeAssignment,
    },
  );
}
