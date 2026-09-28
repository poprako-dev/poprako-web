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
  const string = (key: string): string =>
    decodeString(data?.[key], `workflow event.${kind}.${key}`);
  const number = (key: string): number =>
    decodeNumber(data?.[key], `workflow event.${kind}.${key}`);
  const boolean = (object: Record<string, unknown>, key: string): boolean =>
    decodeBoolean(object[key], `workflow event.${kind}.${key}`);
  switch (kind) {
    case "chapter_created":
    case "chapter_pinned":
    case "chapter_unpinned":
      return { kind };
    case "chapter_subtitle_updated":
      return {
        kind,
        data: {
          previousSubtitle: string("previousSubtitle"),
          nextSubtitle: string("nextSubtitle"),
        },
      };
    case "assignment_created":
      return {
        kind,
        data: {
          subjectUserId: string("subjectUserId"),
          roles: number("roles"),
        },
      };
    case "assignment_roles_updated":
      return {
        kind,
        data: {
          subjectUserId: string("subjectUserId"),
          previousRoles: number("previousRoles"),
          nextRoles: number("nextRoles"),
        },
      };
    case "assignment_deleted":
      return {
        kind,
        data: {
          subjectUserId: string("subjectUserId"),
          previousRoles: number("previousRoles"),
        },
      };
    case "translation_imported": {
      const format = string("format");
      if (format !== "label_plus" && format !== "poprako") {
        throw new Error("Invalid workflow format");
      }
      return {
        kind,
        data: {
          format,
          importedPageCount: number("importedPageCount"),
          importedUnitCount: number("importedUnitCount"),
        },
      };
    }
    case "translation_exported": {
      const formats = decodeObject(data?.["formats"], "workflow export formats");
      return {
        kind,
        data: {
          formats: {
            labelPlus: boolean(formats, "labelPlus"),
            poprako: boolean(formats, "poprako"),
          },
        },
      };
    }
    case "artwork_exported":
      return { kind, data: { artworkVersion: number("artworkVersion") } };
    case "stage_transitioned": {
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
        kind,
        data: {
          stage: stage as UpdateChapterStageRequest["stage"],
          previousPhase: previousPhase as Phase,
          nextPhase: nextPhase as Phase,
          origin: origin as Origin,
        },
      };
    }
    default:
      throw new Error(`Unsupported workflow event ${kind}`);
  }
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
