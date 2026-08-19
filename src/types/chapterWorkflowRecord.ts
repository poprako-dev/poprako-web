export type ChapterWorkflowRecordTranslationFormat = "label_plus" | "poprako";

export type ChapterWorkflowRecordStage =
  | "raw_provide"
  | "translate"
  | "proofread"
  | "typeset_redraw"
  | "review"
  | "publish";

export type ChapterWorkflowRecordPhase = "pending" | "active" | "completed";

export type ChapterWorkflowRecordOrigin =
  | "manual"
  | "unit_edit"
  | "translation_import"
  | "translation_export"
  | "raw_provide_check";

export type ChapterWorkflowRecordEvent =
  | { kind: "chapter_created" }
  | {
      kind: "chapter_subtitle_updated";
      data: {
        previousSubtitle: string;
        nextSubtitle: string;
      };
    }
  | { kind: "chapter_pinned" }
  | { kind: "chapter_unpinned" }
  | {
      kind: "assignment_created";
      data: {
        subjectUserId: string;
        roles: number;
      };
    }
  | {
      kind: "assignment_roles_updated";
      data: {
        subjectUserId: string;
        previousRoles: number;
        nextRoles: number;
      };
    }
  | {
      kind: "assignment_deleted";
      data: {
        subjectUserId: string;
        previousRoles: number;
      };
    }
  | {
      kind: "translation_imported";
      data: {
        format: ChapterWorkflowRecordTranslationFormat;
        importedPageCount: number;
        importedUnitCount: number;
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
        previousPhase: ChapterWorkflowRecordPhase;
        nextPhase: ChapterWorkflowRecordPhase;
        origin: ChapterWorkflowRecordOrigin;
      };
    };

export type ChapterWorkflowRecord = {
  id: string;
  chapterId: string;
  actorUserId: string | null;
  event: ChapterWorkflowRecordEvent;
  createdAt: number;
};
