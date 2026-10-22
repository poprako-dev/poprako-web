import type { ApiClient } from "@/api/client";
import type { ApiAuthResult, ApiMember, ApiTeam, ApiUser } from "@/api/identity-contract";
import type { Result } from "@/shared/utility/result";

export type ListApiMembersOptions = {
  ownerId?: string | undefined;
  teamId?: string | undefined;
  includes?: readonly ("user" | "team")[] | undefined;
  offset: number;
  limit: number;
  nickname?: string | undefined;
  role?: number | undefined;
};

export type ApiImageUploadSlot = {
  putUrl: string;
  imageVersion: number;
  headers: Record<string, string>;
};

export function loginApi(
  client: ApiClient,
  input: { qid: string; password: string },
): Promise<Result<ApiAuthResult>> {
  return client.post<ApiAuthResult>("/auth/login", input, {
    auth: "none",
  });
}

export function registerApi(
  client: ApiClient,
  input: { qid: string; password: string; nickname: string; code: string },
): Promise<Result<ApiAuthResult>> {
  return client.post<ApiAuthResult>("/auth/register", input, {
    auth: "none",
  });
}

export function getMyUser(client: ApiClient): Promise<Result<ApiUser>> {
  return client.get<ApiUser>("/users/me");
}

export function getUser(client: ApiClient, userId: string): Promise<Result<ApiUser>> {
  return client.get<ApiUser>(`/users/${encodeURIComponent(userId)}`);
}

export function listMyMembers(
  client: ApiClient,
  options: {
    offset: number;
    limit: number;
    includes?: readonly ("user" | "team")[] | undefined;
  },
): Promise<Result<ApiMember[]>> {
  return client.get<ApiMember[]>("/members/me", {
    query: {
      offset: options.offset,
      limit: options.limit,
      incl: options.includes,
    },
  });
}

export function listMembers(
  client: ApiClient,
  options: ListApiMembersOptions,
): Promise<Result<ApiMember[]>> {
  return client.get<ApiMember[]>("/members", {
    query: {
      ownerId: options.ownerId,
      teamId: options.teamId,
      incl: options.includes,
      offset: options.offset,
      limit: options.limit,
      fuzzyNickname: options.nickname,
      role: options.role,
    },
  });
}

export function updateMemberRoles(
  client: ApiClient,
  memberId: string,
  roles: number,
): Promise<Result<undefined>> {
  return client.put<undefined>(`/members/${encodeURIComponent(memberId)}/roles`, {
    id: memberId,
    roles,
  });
}

export function joinTeam(client: ApiClient, code: string): Promise<Result<ApiMember>> {
  return client.post<ApiMember>("/members/join", { code });
}

export function listTeams(
  client: ApiClient,
  options: { userId?: string | undefined; offset: number; limit: number },
): Promise<Result<ApiTeam[]>> {
  return client.get<ApiTeam[]>("/teams", {
    query: {
      userId: options.userId,
      offset: options.offset,
      limit: options.limit,
    },
  });
}

export function getTeam(client: ApiClient, teamId: string): Promise<Result<ApiTeam>> {
  return client.get<ApiTeam>(`/teams/${encodeURIComponent(teamId)}`);
}

export function markSelfOnline(
  client: ApiClient,
  teamId: string,
  signal?: AbortSignal,
): Promise<Result<undefined>> {
  return client.put<undefined>(`/teams/${encodeURIComponent(teamId)}/mark-self-online`, undefined, {
    ...(signal ? { signal } : {}),
  });
}

export function listOnlineUserIds(client: ApiClient, teamId: string): Promise<Result<string[]>> {
  return client.get<string[]>(`/teams/${encodeURIComponent(teamId)}/online-users`);
}

export function updateTeam(
  client: ApiClient,
  teamId: string,
  input: { name?: string | undefined; description?: string | undefined },
): Promise<Result<undefined>> {
  return client.put<undefined>(`/teams/${encodeURIComponent(teamId)}`, { id: teamId, ...input });
}

export function updateUserPassword(
  client: ApiClient,
  userId: string,
  input: { currentPassword: string; newPassword: string },
): Promise<Result<undefined>> {
  return client.put<undefined>(`/users/${encodeURIComponent(userId)}/password`, input);
}

export async function allocateUserAvatar(
  client: ApiClient,
  userId: string,
  input: { imageHash: string; newByteLen: number; ext: string },
): Promise<Result<ApiImageUploadSlot | null>> {
  const result = await client.post<{ slot: ApiImageUploadSlot | null }>(
    `/users/${encodeURIComponent(userId)}/avatar/alloc`,
    input,
  );
  return result.success ? { success: true, data: result.data.slot } : result;
}

export function confirmUserAvatar(
  client: ApiClient,
  userId: string,
  imageVersion: number,
): Promise<Result<undefined>> {
  return client.post<undefined>(`/users/${encodeURIComponent(userId)}/avatar/mark-uploaded`, {
    imageVersion,
  });
}

export async function allocateTeamAvatar(
  client: ApiClient,
  teamId: string,
  input: { imageHash: string; newByteLen: number; ext: string },
): Promise<Result<ApiImageUploadSlot | null>> {
  const result = await client.post<{ slot: ApiImageUploadSlot | null }>(
    `/teams/${encodeURIComponent(teamId)}/avatar/alloc`,
    input,
  );
  return result.success ? { success: true, data: result.data.slot } : result;
}

export function confirmTeamAvatar(
  client: ApiClient,
  teamId: string,
  imageVersion: number,
): Promise<Result<undefined>> {
  return client.post<undefined>(`/teams/${encodeURIComponent(teamId)}/avatar/mark-uploaded`, {
    imageVersion,
  });
}

export function logoutUser(client: ApiClient): Promise<Result<undefined>> {
  return client.post<undefined>("/auth/logout", {});
}
