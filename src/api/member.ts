import { unwrapRawMemberInfo, type RawMemberInfo } from "@/types/raw/member";
import { api } from "./util";
import type { Result } from "@/types/utils/result";
import type { MemberInfo } from "@/types/member";

type ListMyMembersArgs = {
  ownerId: string;
  offset?: number;
  limit?: number;
};

export async function listMyMembers(args: ListMyMembersArgs) {
  const result = await api.get<RawMemberInfo[] | null>("/members", {
    owner_id: args.ownerId,
    incl: ["team"],
    offset: args.offset ?? 0,
    limit: args.limit ?? 20,
  });
  if (!result.success) throw new Error(result.error);
  return (result.data ?? []).map(unwrapRawMemberInfo);
}

type ListMembersArgs = {
  teamId: string;
  offset: number;
  limit: number;
  includes?: string[];
  userNicknameKeyword?: string;
  role?: number;
};

type UpdateMemberRoleArgs = {
  id: string;
  roles: number;
};

export async function updateMemberRole(
  args: UpdateMemberRoleArgs,
): Promise<Result<void>> {
  return api.put<void, UpdateMemberRoleArgs>(
    `/members/${args.id}/roles`,
    args,
  );
}

export async function joinMember(
  invitationCode: string,
): Promise<Result<void>> {
  return api.post<void, { code: string }>("/members/join", {
    code: invitationCode,
  });
}

export async function listMembers(
  args: ListMembersArgs,
): Promise<Result<MemberInfo[]>> {
  const query: Record<
    string,
    string | number | boolean | (string | number | boolean)[]
  > = {
    team_id: args.teamId,
    offset: args.offset,
    limit: args.limit,
  };

  if (args.includes) {
    query.incl = args.includes;
  }

  if (args.userNicknameKeyword) {
    query.fuzzy_nickname = args.userNicknameKeyword;
  }

  if (args.role !== undefined) {
    query.role = args.role;
  }

  const result = await api.get<RawMemberInfo[] | null>("/members", query);
  if (!result.success) return result;

  return {
    success: true,
    data: (result.data ?? []).map(unwrapRawMemberInfo),
  };
}
