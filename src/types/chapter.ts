import type { ComicInfo } from "./comic";
import type { UserInfo } from "./user";
import type { WorkflowStatus } from "./workflow";
import type { RawChapterInfo } from "./raw/chapter";
import { unwrapRawComicInfo } from "./raw/comic";
import { unwrapRawUserInfo } from "./raw/user";

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
  comic?: ComicInfo;

  index: number;
  subtitle: string;
  isPinned: boolean;

  pageCount: number;
  totalUnitCount: number;
  translatedUnitCount: number;
  proofreadUnitCount: number;

  stages?: number;

  uploadedAt?: number;
  translatingAt?: number;
  translatedAt?: number;
  typesetAt?: number;
  typesettingAt?: number;
  proofreadAt?: number;
  proofreadingAt?: number;
  reviewedAt?: number;
  publishedAt?: number;

  creatorId: string;
  creator?: UserInfo;

  createdAt: number;
  updatedAt: number;
};

export type CreateChapterArgs = {
  comicId: string;
  subtitle?: string;
};

export type CreateChapterResult = {
  id: string;
};

export type WithWorkflow = {
  stages?: number;
  uploadedAt?: number;
  translatingAt?: number;
  translatedAt?: number;
  typesetAt?: number;
  typesettingAt?: number;
  proofreadAt?: number;
  proofreadingAt?: number;
  reviewedAt?: number;
  publishedAt?: number;
};

type WorkflowStage = "upload" | "translate" | "proofread" | "typeset" | "review" | "publish";

function stagePhase(stages: number, stage: WorkflowStage) {
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

function workflowStatusFromStages(
  stages: number | undefined,
  stage: WorkflowStage,
): WorkflowStatus | undefined {
  if (stages === undefined) return undefined;

  const phase = stagePhase(stages, stage);
  if (phase === 0) return "pending";
  if (phase === 1) return "ongoing";
  if (phase === 2) return "completed";
  return "unset";
}

export function uploadWorkflowStatus(chapter: WithWorkflow) {
  const status = workflowStatusFromStages(chapter.stages, "upload");
  if (status !== undefined) return status;

  if (chapter.uploadedAt) {
    return "completed" as WorkflowStatus;
  }
  return "pending" as WorkflowStatus;
}

export function translateWorkflowStatus(chapter: WithWorkflow) {
  const status = workflowStatusFromStages(chapter.stages, "translate");
  if (status !== undefined) return status;

  if (chapter.translatedAt) {
    return "completed" as WorkflowStatus;
  }
  if (chapter.translatingAt) {
    return "ongoing" as WorkflowStatus;
  }
  return "pending" as WorkflowStatus;
}

export function typesetWorkflowStatus(chapter: WithWorkflow) {
  const status = workflowStatusFromStages(chapter.stages, "typeset");
  if (status !== undefined) return status;

  if (chapter.typesetAt) {
    return "completed" as WorkflowStatus;
  }
  if (chapter.typesettingAt) {
    return "ongoing" as WorkflowStatus;
  }
  return "pending" as WorkflowStatus;
}

export function proofreadWorkflowStatus(chapter: WithWorkflow) {
  const status = workflowStatusFromStages(chapter.stages, "proofread");
  if (status !== undefined) return status;

  if (chapter.proofreadAt) {
    return "completed" as WorkflowStatus;
  }
  if (chapter.proofreadingAt) {
    return "ongoing" as WorkflowStatus;
  }
  return "pending" as WorkflowStatus;
}

export function reviewWorkflowStatus(chapter: WithWorkflow) {
  const status = workflowStatusFromStages(chapter.stages, "review");
  if (status !== undefined) return status;

  if (chapter.reviewedAt) {
    return "completed" as WorkflowStatus;
  }
  return "pending" as WorkflowStatus;
}

export function publishWorkflowStatus(chapter: WithWorkflow) {
  const status = workflowStatusFromStages(chapter.stages, "publish");
  if (status !== undefined) return status;

  if (chapter.publishedAt) {
    return "completed" as WorkflowStatus;
  }
  return "pending" as WorkflowStatus;
}

export function canApplyWorkflowTransition(
  chapter: WithWorkflow,
  transition: WorkflowTransition,
) {
  if (chapter.stages !== undefined) {
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
      case "publish_complete":
        return status === "pending";
      case "translate_start":
      case "proofread_start":
      case "typeset_start":
        return status === "pending";
      case "translate_complete":
      case "proofread_complete":
      case "typeset_complete":
        return status === "ongoing";
      case "upload_revert":
      case "review_revert":
        return status === "completed";
      case "translate_start_revert":
      case "proofread_start_revert":
      case "typeset_start_revert":
        return status === "ongoing";
      case "translate_revert":
      case "proofread_revert":
      case "typeset_revert":
        return status === "completed";
    }
  }

  switch (transition) {
    case "upload_complete":
      return !chapter.uploadedAt;
    case "translate_start":
      return !chapter.translatingAt && !chapter.translatedAt;
    case "translate_complete":
      return !!chapter.translatingAt && !chapter.translatedAt;
    case "proofread_start":
      return !chapter.proofreadingAt && !chapter.proofreadAt;
    case "proofread_complete":
      return !!chapter.proofreadingAt && !chapter.proofreadAt;
    case "typeset_start":
      return !chapter.typesettingAt && !chapter.typesetAt;
    case "typeset_complete":
      return !!chapter.typesettingAt && !chapter.typesetAt;
    case "review_complete":
      return !chapter.reviewedAt;
    case "publish_complete":
      return !chapter.publishedAt;
    case "upload_revert":
      return !!chapter.uploadedAt;
    case "translate_start_revert":
      return !!chapter.translatingAt && !chapter.translatedAt;
    case "translate_revert":
      return !!chapter.translatedAt;
    case "proofread_start_revert":
      return !!chapter.proofreadingAt && !chapter.proofreadAt;
    case "proofread_revert":
      return !!chapter.proofreadAt;
    case "typeset_start_revert":
      return !!chapter.typesettingAt && !chapter.typesetAt;
    case "typeset_revert":
      return !!chapter.typesetAt;
    case "review_revert":
      return !!chapter.reviewedAt;
    default:
      return false;
  }
}

export function toChapterInfo(raw?: RawChapterInfo): ChapterInfo | undefined {
  if (!raw) return undefined;

  return {
    id: raw.id,
    comicId: raw.comic_id,
    comic: raw.comic
      ? (unwrapRawComicInfo(raw.comic) as unknown as ComicInfo)
      : undefined,
    creatorId: raw.creator_id,
    creator: raw.creator
      ? (unwrapRawUserInfo(raw.creator) as unknown as UserInfo)
      : undefined,
    index: raw.index,
    subtitle: raw.subtitle,
    isPinned: raw.is_pinned,
    pageCount: raw.page_count,
    totalUnitCount: raw.total_unit_count,
    translatedUnitCount: raw.translated_unit_count,
    proofreadUnitCount: raw.proofread_unit_count,
    stages: raw.stages,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  } as ChapterInfo;
}
