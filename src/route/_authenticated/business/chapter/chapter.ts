import type { ComicInfo } from "@/route/_authenticated/business/comic/comic";
import type { UserInfo } from "@/route/business/identity/user";
import type { WorkflowStatus } from "@/route/_authenticated/business/chapter/workflow";

export type WorkflowTransition =
  | "upload_complete"
  | "translate_start"
  | "translate_complete"
  | "proofread_start"
  | "proofread_complete"
  | "typeset_start"
  | "typeset_complete"
  | "review_complete"
  | "publish_complete"
  | "upload_revert"
  | "translate_start_revert"
  | "translate_revert"
  | "proofread_start_revert"
  | "proofread_revert"
  | "typeset_start_revert"
  | "typeset_revert"
  | "review_revert";

export type ChapterInfo = {
  id: string;

  comicId: string;
  comic?: ComicInfo | undefined;

  index: number;
  subtitle: string;
  isPinned: boolean;

  pageCount: number;
  totalUnitCount: number;
  translatedUnitCount: number;
  proofreadUnitCount: number;

  stages: number;

  creatorId: string;
  creator?: UserInfo | undefined;

  createdAt: number;
  updatedAt: number;
};

export type CreateChapterArgs = {
  comicId: string;
  subtitle?: string | undefined;
};

export type CreateChapterResult = {
  id: string;
};

export type WithWorkflow = {
  stages: number;
};

type WorkflowStage = "upload" | "translate" | "proofread" | "typeset" | "review" | "publish";

function stagePhase(stages: number, stage: WorkflowStage): number {
  const offset: Record<WorkflowStage, number> = {
    upload: 0,
    translate: 2,
    proofread: 4,
    typeset: 6,
    review: 8,
    publish: 10,
  };

  return (stages >> offset[stage]) & 0b11;
}

function workflowStatusFromStages(stages: number, stage: WorkflowStage): WorkflowStatus {
  const phase = stagePhase(stages, stage);
  if (phase === 0) return "pending";
  if (phase === 1) return "ongoing";
  if (phase === 2) return "completed";
  return "unset";
}
export function uploadWorkflowStatus(chapter: WithWorkflow): WorkflowStatus {
  return workflowStatusFromStages(chapter.stages, "upload");
}
export function translateWorkflowStatus(chapter: WithWorkflow): WorkflowStatus {
  return workflowStatusFromStages(chapter.stages, "translate");
}
export function typesetWorkflowStatus(chapter: WithWorkflow): WorkflowStatus {
  return workflowStatusFromStages(chapter.stages, "typeset");
}
export function proofreadWorkflowStatus(chapter: WithWorkflow): WorkflowStatus {
  return workflowStatusFromStages(chapter.stages, "proofread");
}
export function reviewWorkflowStatus(chapter: WithWorkflow): WorkflowStatus {
  return workflowStatusFromStages(chapter.stages, "review");
}
export function publishWorkflowStatus(chapter: WithWorkflow): WorkflowStatus {
  return workflowStatusFromStages(chapter.stages, "publish");
}
export function canApplyWorkflowTransition(
  chapter: WithWorkflow,
  transition: WorkflowTransition,
): boolean {
  const statusByTransition: Record<WorkflowTransition, WorkflowStatus> = {
    upload_complete: uploadWorkflowStatus(chapter),
    translate_start: translateWorkflowStatus(chapter),
    translate_complete: translateWorkflowStatus(chapter),
    proofread_start: proofreadWorkflowStatus(chapter),
    proofread_complete: proofreadWorkflowStatus(chapter),
    typeset_start: typesetWorkflowStatus(chapter),
    typeset_complete: typesetWorkflowStatus(chapter),
    review_complete: reviewWorkflowStatus(chapter),
    publish_complete: publishWorkflowStatus(chapter),
    upload_revert: uploadWorkflowStatus(chapter),
    translate_start_revert: translateWorkflowStatus(chapter),
    translate_revert: translateWorkflowStatus(chapter),
    proofread_start_revert: proofreadWorkflowStatus(chapter),
    proofread_revert: proofreadWorkflowStatus(chapter),
    typeset_start_revert: typesetWorkflowStatus(chapter),
    typeset_revert: typesetWorkflowStatus(chapter),
    review_revert: reviewWorkflowStatus(chapter),
  };
  const status = statusByTransition[transition];

  switch (transition) {
    case "upload_complete":
    case "review_complete":
    case "publish_complete": {
      return status === "pending";
    }
    case "translate_start":
    case "proofread_start":
    case "typeset_start": {
      return status === "pending";
    }
    case "translate_complete":
    case "proofread_complete":
    case "typeset_complete": {
      return status === "ongoing";
    }
    case "upload_revert":
    case "review_revert": {
      return status === "completed";
    }
    case "translate_start_revert":
    case "proofread_start_revert":
    case "typeset_start_revert": {
      return status === "ongoing";
    }
    case "translate_revert":
    case "proofread_revert":
    case "typeset_revert": {
      return status === "completed";
    }
  }
}
