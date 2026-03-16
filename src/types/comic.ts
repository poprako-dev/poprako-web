import type { UserInfo } from "./user";
import type { WorksetInfo } from "./workset";

export type ComicInfo = {
  id: string;

  worksetId: string;
  workset?: WorksetInfo;

  title: string;
  author: string;
  description: string;

  index: number;
  chapterCount: number;
  creatorId: string;
  creator?: UserInfo;

  lastActiveAt: number;

  createdAt: number;
  updatedAt: number;
};

export type CreateComicArgs = {
  teamId: string;
  title: string;
  author?: string;
  description?: string;
};

export type CreateComicResult = { id: string };

export type UpdateComicArgs = {
  id: string;
  title?: string;
  author?: string;
  description?: string;
};
