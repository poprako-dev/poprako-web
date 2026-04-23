import type { ChapterInfo } from "./chapter";
import type { UserInfo } from "./user";

export type AssignmentInfo = {
  id: string;

  chapterId: string;
  chapter?: ChapterInfo;

  userId: string;
  user?: UserInfo;

  assignedRawProviderAt?: number;
  assignedTranslatorAt?: number;
  assignedProofreaderAt?: number;
  assignedTypesetterAt?: number;
  assignedRedrawerAt?: number;
  assignedReviewerAt?: number;
  assignedPublisherAt?: number;

  createdAt: number;
  updatedAt: number;
};
