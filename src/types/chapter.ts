import type { ComicInfo } from "./comic";
import type { UserInfo } from "./user";
import type { WorkflowStatus } from "./workflow";

export type ChapterInfo = {
  id: string;

  comicId: string;
  comic?: ComicInfo;

  index: number;
  subtitle: string;

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
  chapterNo: string;
};

export type CreateChapterResult = {
  id: string;
};

export type UpdateChapterArgs = {
  chapterId: string;
  chapterNo?: string;
  translateStatus?: WorkflowStatus;
  typesetStatus?: WorkflowStatus;
  reviewStatus?: WorkflowStatus;
  proofreadStatus?: WorkflowStatus;
  publishStatus?: WorkflowStatus;
  uploadStatus?: WorkflowStatus;
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
    return "in_progress" as WorkflowStatus;
  }
  return "pending" as WorkflowStatus;
}

export function typesetWorkflowStatus(chapter: WithWorkflow) {
  if (chapter.typesetAt) {
    return "completed" as WorkflowStatus;
  }
  if (chapter.typesettingAt) {
    return "in_progress" as WorkflowStatus;
  }
  return "pending" as WorkflowStatus;
}

export function proofreadWorkflowStatus(chapter: WithWorkflow) {
  if (chapter.proofreadAt) {
    return "completed" as WorkflowStatus;
  }
  if (chapter.proofreadingAt) {
    return "in_progress" as WorkflowStatus;
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
