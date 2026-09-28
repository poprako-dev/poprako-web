import type { ApiClient } from "@/api/client";
import { listMembers } from "@/route/business/identity/member-request";
import { getComic } from "@/route/_authenticated/business/comic/comic-request";
import { getPinnedChapter } from "@/route/_authenticated/business/chapter/chapter-request";
import type { ChapterInfo } from "@/route/_authenticated/business/chapter/chapter";
import type { ComicInfo } from "@/route/_authenticated/business/comic/comic";
import type { MemberInfo } from "@/route/business/identity/member";
import type { TeamInfo } from "@/route/business/identity/team";
import type { WorksetInfo } from "@/route/_authenticated/business/workset/workset";
import { type Role, roleMask } from "@/route/business/identity/role";
import type { Result } from "@/shared/utility/result";

export type DetailComicInfo = ComicInfo & {
  workset: WorksetInfo;
  team: TeamInfo;
};

export type ComicDetailData = {
  comicInfo: DetailComicInfo;
  pinnedChapter: ChapterInfo | null;
};

export type AssignableMemberArgs = {
  role: Role;
  keyword?: string | undefined;
  offset: number;
  limit: number;
};

export async function loadComicDetail(
  client: ApiClient,
  comicId: string,
): Promise<Result<ComicDetailData>> {
  const [comicResult, pinnedResult] = await Promise.all([
    getComic(client, comicId, ["workset.team"]),
    getPinnedChapter(client, comicId),
  ]);
  if (!comicResult.success) return comicResult;
  if (!pinnedResult.success) return pinnedResult;

  const comicInfo = comicResult.data;
  const { workset, team } = comicInfo;
  if (!workset || !team || workset.id !== comicInfo.worksetId || workset.teamId !== team.id) {
    return { success: false, error: "漫画所属团队信息不完整，请重新加载" };
  }

  return {
    success: true,
    data: {
      comicInfo: { ...comicInfo, workset, team },
      pinnedChapter: pinnedResult.data,
    },
  };
}

export function findComicMember(comic: DetailComicInfo, members: MemberInfo[]): MemberInfo | null {
  return members.find((member) => member.teamId === comic.workset.teamId) ?? null;
}

export function listComicMembers(
  client: ApiClient,
  comic: DetailComicInfo,
  args: AssignableMemberArgs,
): Promise<Result<MemberInfo[]>> {
  return listMembers(client, {
    teamId: comic.workset.teamId,
    offset: args.offset,
    limit: args.limit,
    includes: ["user"],
    nickname: args.keyword,
    role: roleMask([args.role]),
  });
}
