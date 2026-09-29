import type { ApiClient } from "@/api/client";
import {
  joinTeam as joinTeamApi,
  listMembers as listMembersApi,
  listMyMembers as listMyMembersApi,
  updateMemberRoles,
} from "@/api/identity/identity-api";
import type { Result } from "@/shared/utility/result";
import { toMemberInfo } from "@/route/business/identity/api-adapter";
import type { MemberInfo } from "@/route/business/identity/member";

type ListMyMembersArgs = {
  offset: number;
  limit: number;
  includes?: readonly ("user" | "team")[] | undefined;
};

export async function listMyMembers(
  client: ApiClient,
  args: ListMyMembersArgs,
): Promise<Result<MemberInfo[]>> {
  const result = await listMyMembersApi(client, args);
  return result.success ? { success: true, data: result.data.map(toMemberInfo) } : result;
}

type ListMembersArgs = {
  ownerId?: string | undefined;
  teamId?: string | undefined;
  offset: number;
  limit: number;
  includes?: readonly ("user" | "team")[] | undefined;
  nickname?: string | undefined;
  role?: number | undefined;
};

export async function listMembers(
  client: ApiClient,
  args: ListMembersArgs,
): Promise<Result<MemberInfo[]>> {
  const result = await listMembersApi(client, args);
  return result.success ? { success: true, data: result.data.map(toMemberInfo) } : result;
}

export function updateMemberRole(
  client: ApiClient,
  memberId: string,
  roles: number,
): Promise<Result<void>> {
  return updateMemberRoles(client, memberId, roles);
}

export async function joinMember(client: ApiClient, invitationCode: string): Promise<Result<void>> {
  const result = await joinTeamApi(client, invitationCode);
  return result.success ? { success: true, data: undefined } : result;
}
