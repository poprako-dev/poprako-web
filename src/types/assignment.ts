import type { ChapterWithComicInfo, WithWorkflow } from "./chapter";

export type AssignmentWithChapterInfo = {
  id: string;

  chapter: ChapterWithComicInfo;
  userId: string;

  roles: number;
};

export type AssignmentInfo = {
  id: string;
  chapterId: string;
  userId: string;
  roles: number;
};

export type ReviewerAssignmentWithChapterInfo = Omit<
  AssignmentWithChapterInfo,
  "chapter"
> & {
  chapter: ChapterWithComicInfo & WithWorkflow;
};
