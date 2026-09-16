import type { RawComicInfo } from "@/types/raw/comic";
import type { RawChapterInfo } from "@/types/raw/chapter";
import type { RawMemberInfo } from "@/types/raw/member";
import type { RawUserInfo } from "@/types/raw/user";

export function detailUser(id = "reader"): RawUserInfo {
  return {
    id, qid: id, nickname: id, avatar_url: null, is_sadmin: false,
    last_active_at: 1, created_at: 1, updated_at: 1,
  };
}

export function detailComic(id = "comic-b", teamId = "team-b"): RawComicInfo {
  return {
    id, workset_id: `workset-${id}`, index: 0, chapter_count: 1,
    title: id, author: "author", description: null, cover_url: null,
    creator_id: "reader", creator: detailUser(),
    last_active_at: 1, created_at: 1, updated_at: 1,
    workset: {
      id: `workset-${id}`, team_id: teamId, index: 0, name: "workset",
      description: "", comic_count: 1, created_at: 1, updated_at: 1,
    },
    team: {
      id: teamId, name: teamId, description: "", avatar_url: null, created_at: 1, updated_at: 1,
    },
  };
}

export function detailChapter(comicId = "comic-b"): RawChapterInfo {
  return {
    id: `pinned-${comicId}`, comic_id: comicId, creator_id: "reader", index: 0,
    subtitle: "pinned", page_count: 0, total_unit_count: 0, translated_unit_count: 0,
    proofread_unit_count: 0, is_pinned: true, stages: 0, created_at: 1, updated_at: 1,
  };
}

export function detailMember(teamId: string, userId = "reader", roles = 2): RawMemberInfo {
  return {
    id: `${teamId}-${userId}`, user_id: userId, team_id: teamId, user: detailUser(userId),
    nickname: userId, last_active_at: 1, roles, created_at: 1, updated_at: 1,
  };
}
