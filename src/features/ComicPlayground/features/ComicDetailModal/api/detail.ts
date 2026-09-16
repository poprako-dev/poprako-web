import { listMembers } from "@/api/member";
import { getComic } from "@/features/ComicPlayground/api/comic";
import { getPinnedChapter } from "@/features/ComicPlayground/api/chapter";
import type { ChapterInfo, ComicInfo } from "@/types";
import type { MemberInfo } from "@/types/member";
import type { TeamInfo } from "@/types/team";
import type { WorksetInfo } from "@/types/workset";
import { roleMask, type Role } from "@/types/role";
import type { Result } from "@/types/utils/result";

export type DetailComicInfo = ComicInfo & { workset: WorksetInfo; team: TeamInfo };

export interface ComicDetailData {
  comicInfo: DetailComicInfo;
  pinnedChapter: ChapterInfo | null;
}

export interface AssignableMemberArgs {
  role: Role;
  keyword?: string | undefined;
  offset: number;
  limit: number;
}

export async function loadComicDetail(comicId: string): Promise<Result<ComicDetailData>> {
  const [comicResult, pinnedResult] = await Promise.all([
    getComic(comicId, ["workset.team"]),
    getPinnedChapter(comicId),
  ]);
  if (!comicResult.success) {return comicResult;}
  if (!pinnedResult.success) {return pinnedResult;}

  const comicInfo = comicResult.data;
  const { workset, team } = comicInfo;
  if (!workset || !team || workset.id !== comicInfo.worksetId || workset.teamId !== team.id) {
    return { success: false, error: "漫画所属团队信息不完整，请重新加载" };
  }

  return {
    success: true,
    data: { comicInfo: { ...comicInfo, workset, team }, pinnedChapter: pinnedResult.data },
  };
}

export function findComicMember(
  comic: DetailComicInfo,
  members: MemberInfo[],
): MemberInfo | null {
  return members.find((member) => member.teamId === comic.workset.teamId) ?? null;
}

export function listComicMembers(comic: DetailComicInfo, args: AssignableMemberArgs) {
  return listMembers({
    teamId: comic.workset.teamId,
    offset: args.offset,
    limit: args.limit,
    includes: ["user"],
    userNicknameKeyword: args.keyword,
    role: roleMask([args.role]),
  });
}
