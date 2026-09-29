import type { UserInfo } from "@/route/business/identity/user";
import type { WorksetInfo } from "@/route/_authenticated/business/workset/workset";
import type { TeamInfo } from "@/route/business/identity/team";
import type { ChapterInfo } from "@/route/_authenticated/business/chapter/chapter";
import type { AssignmentInfo } from "@/route/_authenticated/business/assignment/assignment";

export type ComicInfo = {
  id: string;

  worksetId: string;
  workset?: WorksetInfo | undefined;
  team?: TeamInfo | undefined;

  index: number;
  chapterCount: number;

  title: string;
  author: string;
  description: string;

  coverUrl: string;
  coverThumbnailUrl?: string | undefined;
  isCoverUploaded: boolean;

  creatorId: string;
  creator?: UserInfo | undefined;

  pinnedChapter?: ChapterInfo | undefined;
  pinnedChapterAssignments?: AssignmentInfo[] | undefined;

  lastActiveAt: number;

  createdAt: number;
  updatedAt: number;
};

export type CreateComicArgs = {
  worksetId: string;
  title: string;
  author: string;
  description?: string | undefined;
  firstChapterTitle?: string | undefined;
};

export type CreateComicResult = { id: string };

export type UpdateComicArgs = {
  id: string;
  title?: string | undefined;
  author?: string | undefined;
  description?: string | undefined;
};
