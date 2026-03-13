import type { ComicInfo } from "./comic";
import type { WorkflowStatus } from "./workflow";

export type ChapterDetail = {
  id: string;

  chapterNo: string;
  comicId: string;

  creatorId: string;

  coverUrl: string;

  index: number;
  pageCount: number;

  totalUnitCount: number;
  translatedUnitCount: number;
  proofreadUnitCount: number;

  createdAt: number;
  updatedAt: number;

  // workflow timestamps
  uploadedAt?: number;
  transalatingAt?: number;
  translatedAt?: number;
  typesetAt?: number;
  typesettingAt?: number;
  proofreadAt?: number;
  proofreadingAt?: number;
  reviewedAt?: number;
  publishedAt?: number;
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

export type ChapterWithComicInfo = {
  id: string;

  comic: ComicInfo;
  index: number;
  chapterNo: string;

  coverUrl: string;

  pageCount: number;
  totalUnitCount: number;
  translatedUnitCount: number;
  proofreadUnitCount: number;

  createdAt: number;
  updatedAt: number;
};

export type WithWorkflow = {
  uploadedAt?: number;
  transalatingAt?: number;
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
  if (chapter.transalatingAt) {
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
