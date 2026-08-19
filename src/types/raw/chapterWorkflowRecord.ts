import type {
  ChapterWorkflowRecord,
  ChapterWorkflowRecordEvent,
  ChapterWorkflowRecordOrigin,
  ChapterWorkflowRecordPhase,
  ChapterWorkflowRecordStage,
  ChapterWorkflowRecordTranslationFormat,
} from "../chapterWorkflowRecord";

export type RawChapterWorkflowRecordEvent =
  | { kind: "chapter_created" }
  | {
      kind: "chapter_subtitle_updated";
      data: {
        previous_subtitle: string;
        next_subtitle: string;
      };
    }
  | { kind: "chapter_pinned" }
  | { kind: "chapter_unpinned" }
  | {
      kind: "assignment_created";
      data: {
        subject_user_id: string;
        roles: number;
      };
    }
  | {
      kind: "assignment_roles_updated";
      data: {
        subject_user_id: string;
        previous_roles: number;
        next_roles: number;
      };
    }
  | {
      kind: "assignment_deleted";
      data: {
        subject_user_id: string;
        previous_roles: number;
      };
    }
  | {
      kind: "translation_imported";
      data: {
        format: ChapterWorkflowRecordTranslationFormat;
        imported_page_count: number;
        imported_unit_count: number;
      };
    }
  | {
      kind: "translation_exported";
      data: {
        format: ChapterWorkflowRecordTranslationFormat;
      };
    }
  | {
      kind: "stage_transitioned";
      data: {
        stage: ChapterWorkflowRecordStage;
        previous_phase: ChapterWorkflowRecordPhase;
        next_phase: ChapterWorkflowRecordPhase;
        origin: ChapterWorkflowRecordOrigin;
      };
    };

export type RawChapterWorkflowRecord = {
  id: string;
  chapter_id: string;
  actor_user_id: string | null;
  event: RawChapterWorkflowRecordEvent;
  created_at: number;
};

function unsupportedEvent(event: never): never {
  throw new Error(`Unsupported chapter workflow event: ${JSON.stringify(event)}`);
}

export function unwrapRawChapterWorkflowRecordEvent(
  event: RawChapterWorkflowRecordEvent,
): ChapterWorkflowRecordEvent {
  switch (event.kind) {
    case "chapter_created":
    case "chapter_pinned":
    case "chapter_unpinned":
      return { kind: event.kind };
    case "chapter_subtitle_updated":
      return {
        kind: event.kind,
        data: {
          previousSubtitle: event.data.previous_subtitle,
          nextSubtitle: event.data.next_subtitle,
        },
      };
    case "assignment_created":
      return {
        kind: event.kind,
        data: {
          subjectUserId: event.data.subject_user_id,
          roles: event.data.roles,
        },
      };
    case "assignment_roles_updated":
      return {
        kind: event.kind,
        data: {
          subjectUserId: event.data.subject_user_id,
          previousRoles: event.data.previous_roles,
          nextRoles: event.data.next_roles,
        },
      };
    case "assignment_deleted":
      return {
        kind: event.kind,
        data: {
          subjectUserId: event.data.subject_user_id,
          previousRoles: event.data.previous_roles,
        },
      };
    case "translation_imported":
      return {
        kind: event.kind,
        data: {
          format: event.data.format,
          importedPageCount: event.data.imported_page_count,
          importedUnitCount: event.data.imported_unit_count,
        },
      };
    case "translation_exported":
      return {
        kind: event.kind,
        data: { format: event.data.format },
      };
    case "stage_transitioned":
      return {
        kind: event.kind,
        data: {
          stage: event.data.stage,
          previousPhase: event.data.previous_phase,
          nextPhase: event.data.next_phase,
          origin: event.data.origin,
        },
      };
    default:
      return unsupportedEvent(event);
  }
}

export function unwrapRawChapterWorkflowRecord(
  raw: RawChapterWorkflowRecord,
): ChapterWorkflowRecord {
  return {
    id: raw.id,
    chapterId: raw.chapter_id,
    actorUserId: raw.actor_user_id,
    event: unwrapRawChapterWorkflowRecordEvent(raw.event),
    createdAt: raw.created_at,
  };
}
