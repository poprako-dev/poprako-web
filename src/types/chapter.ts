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

export type UpdateChapterArgs = {
  subtitle?: string;
  isPinned?: boolean;
  workflowTransition?: WorkflowTransition;
  revertTransition?: WorkflowTransition;
};

export type WithWorkflow = {
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

export function uploadWorkflowStatus(chapter: WithWorkflow) {
  if (chapter.uploadedAt) {
    return "completed" as WorkflowStatus;
  }
  return "pending" as WorkflowStatus;
}

export function translateWorkflowStatus(chapter: WithWorkflow) {
  if (chapter.translatedAt) {
    return "completed" as WorkflowStatus;
  }
  if (chapter.translatingAt) {
    return "ongoing" as WorkflowStatus;
  }
  return "pending" as WorkflowStatus;
}

export function typesetWorkflowStatus(chapter: WithWorkflow) {
  if (chapter.typesetAt) {
    return "completed" as WorkflowStatus;
  }
  if (chapter.typesettingAt) {
    return "ongoing" as WorkflowStatus;
  }
  return "pending" as WorkflowStatus;
}

export function proofreadWorkflowStatus(chapter: WithWorkflow) {
  if (chapter.proofreadAt) {
    return "completed" as WorkflowStatus;
  }
  if (chapter.proofreadingAt) {
    return "ongoing" as WorkflowStatus;
  }
  return "pending" as WorkflowStatus;
}

export function reviewWorkflowStatus(chapter: WithWorkflow) {
  if (chapter.reviewedAt) {
    return "completed" as WorkflowStatus;
  }
  return "pending" as WorkflowStatus;
}

export function publishWorkflowStatus(chapter: WithWorkflow) {
  if (chapter.publishedAt) {
    return "completed" as WorkflowStatus;
  }
  return "pending" as WorkflowStatus;
}

export function canApplyWorkflowTransition(
  chapter: WithWorkflow,
  transition: WorkflowTransition,
) {
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
    isPinned: raw.is_pinned ?? false,
    pageCount: raw.page_count,
    totalUnitCount: raw.total_unit_count,
    translatedUnitCount: raw.translated_unit_count,
    proofreadUnitCount: raw.proofread_unit_count,
    uploadedAt: raw.uploaded_at,
    translatingAt: raw.translating_at,
    translatedAt: raw.translated_at,
    typesetAt: raw.typeset_at,
    typesettingAt: raw.typesetting_at,
    proofreadAt: raw.proofread_at,
    proofreadingAt: raw.proofreading_at,
    reviewedAt: raw.reviewed_at,
    publishedAt: raw.published_at,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  } as ChapterInfo;
}
