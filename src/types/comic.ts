import { unwrapRawComicInfo, type RawComicInfo } from "./raw/comic";
import type { UserInfo } from "./user";
import type { WorksetInfo } from "./workset";
import type { TeamInfo } from "./team";
import type { ChapterInfo } from "./chapter";
import type { AssignmentInfo } from "./assignment";

export interface ComicInfo {
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
}

export function toComicInfo(raw?: RawComicInfo) {
  return raw ? unwrapRawComicInfo(raw) : undefined;
}

export interface CreateComicArgs {
  worksetId: string;
  title: string;
  author: string;
  description?: string | undefined;
  firstChapterTitle?: string | undefined;
}

export interface CreateComicResult { id: string }

export interface UpdateComicArgs {
  id: string;
  title?: string | undefined;
  author?: string | undefined;
  description?: string | undefined;
}
