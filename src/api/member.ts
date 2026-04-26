import { unwrapRawMemberInfo, type RawMemberInfo } from "@/types/raw/member";
import { api } from "./util";
import type { Result } from "@/types/utils/result";
import type { MemberInfo } from "@/types/member";

export async function listMyMembers() {
  const result = await api.get<RawMemberInfo[] | null>("/members/mine", {
    includes: ["team"],
    offset: 0,
    limit: 100,
  });
  if (!result.success) throw new Error(result.error);
  return (result.data ?? []).map(unwrapRawMemberInfo);
}

type ListMembersArgs = {
  teamId: string;
  offset: number;
  limit: number;
  includes?: string[];
};

type UpdateMemberRoleArgs = {
  id: string;
  roles: number;
};

export async function updateMemberRole(
  args: UpdateMemberRoleArgs,
): Promise<Result<void>> {
  return api.put<void, UpdateMemberRoleArgs>(
    `/members/${args.id}`,
    args,
  );
}

export async function listMembers(
  args: ListMembersArgs,
): Promise<Result<MemberInfo[]>> {
  const query: Record<string, string | number | boolean | (string | number | boolean)[]> = {
    team_id: args.teamId,
    offset: args.offset,
    limit: args.limit,
  };

  if (args.includes) {
    query.includes = args.includes;
  }

  const result = await api.get<RawMemberInfo[] | null>("/members", query);

  if (!result.success) return result;

  return {
    success: true,
    data: (result.data ?? []).map(unwrapRawMemberInfo),
  };
}
