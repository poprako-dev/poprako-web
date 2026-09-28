import { type RawMemberInfo, unwrapRawMemberInfo } from "@/routes/business/identity/raw-member";
import { api, toApiRequestError } from "@/routes/business/request";
import type { Result } from "@/shared/utility/result";
import type { MemberInfo } from "@/routes/business/identity/member";

type ListMyMembersArgs = {
  ownerId: string;
  offset?: number | undefined;
  limit?: number | undefined;
};

export async function listMyMembers(args: ListMyMembersArgs): Promise<MemberInfo[]> {
  const result = await api.get<RawMemberInfo[] | null>("/members", {
    owner_id: args.ownerId,
    incl: ["team"],
    offset: args.offset ?? 0,
    limit: args.limit ?? 20,
  });
  if (!result.success) throw toApiRequestError(result);
  return result.data?.map((item) => unwrapRawMemberInfo(item)) ?? [];
}

type ListMembersArgs = {
  teamId: string;
  offset: number;
  limit: number;
  includes?: string[] | undefined;
  userNicknameKeyword?: string | undefined;
  role?: number | undefined;
};

type UpdateMemberRoleArgs = {
  id: string;
  roles: number;
};

export async function updateMemberRole(args: UpdateMemberRoleArgs): Promise<Result<undefined>> {
  return api.put<undefined, UpdateMemberRoleArgs>(`/members/${args.id}/roles`, args);
}

export async function joinMember(invitationCode: string): Promise<Result<undefined>> {
  return api.post<undefined, { code: string }>("/members/join", {
    code: invitationCode,
  });
}

export async function listMembers(args: ListMembersArgs): Promise<Result<MemberInfo[]>> {
  const query: Record<string, string | number | boolean | (string | number | boolean)[]> = {
    team_id: args.teamId,
    offset: args.offset,
    limit: args.limit,
  };

  if (args.includes) {
    query["incl"] = args.includes;
  }

  if (args.userNicknameKeyword) {
    query["fuzzy_nickname"] = args.userNicknameKeyword;
  }

  if (args.role !== undefined) {
    query["role"] = args.role;
  }

  const result = await api.get<RawMemberInfo[] | null>("/members", query);
  if (!result.success) return result;

  return {
    success: true,
    data: result.data?.map((item) => unwrapRawMemberInfo(item)) ?? [],
  };
}
