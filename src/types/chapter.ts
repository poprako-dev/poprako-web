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

export type CreateChapterResult = { id: string };

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
