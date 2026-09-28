import type { ComicResponse, ChapterResponse, AssignmentResponse } from "@/api/content-contract";
import type { WorksetResponse } from "@/api/workset/workset-api";
import type { ComicInfo } from "./comic/comic";
import type { ChapterInfo } from "./chapter/chapter";
import type { AssignmentInfo } from "./assignment/assignment";
import type { WorksetInfo } from "./workset/workset";
import { toUserInfo, toTeamInfo } from "@/route/business/identity/api-adapter";
import { ensureHttpsUrl } from "@/shared/utility/url";

export function toWorksetInfo(value: WorksetResponse): WorksetInfo {
  return { ...value, description: value.description ?? "" };
}
export function toComicInfo(value: ComicResponse): ComicInfo {
  return {
    ...value,
    workset: value.workset ? toWorksetInfo(value.workset) : undefined,
    team: value.team ? toTeamInfo(value.team) : undefined,
    creator: value.creator ? toUserInfo(value.creator) : undefined,
    description: value.description ?? "",
    coverUrl: ensureHttpsUrl(value.coverUrl),
    coverThumbnailUrl: ensureHttpsUrl(value.coverThumbnailUrl),
    isCoverUploaded: Boolean(value.coverUrl),
  };
}
export function toChapterInfo(value: ChapterResponse): ChapterInfo {
  return {
    ...value,
    comic: value.comic ? toComicInfo(value.comic) : undefined,
    creator: value.creator ? toUserInfo(value.creator) : undefined,
  };
}
export function toAssignmentInfo(value: AssignmentResponse): AssignmentInfo {
  return {
    ...value,
    user: value.user ? toUserInfo(value.user) : undefined,
    chapter: value.chapter ? toChapterInfo(value.chapter) : undefined,
  };
}
