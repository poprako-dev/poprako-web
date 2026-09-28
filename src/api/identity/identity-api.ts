import {
  decodeApiAuthResult,
  decodeApiMember,
  decodeApiTeam,
  decodeApiUser,
} from "@/api/identity-contract";
import type { ApiClient } from "@/api/client";
import { decodeArray, decodeNumber, decodeObject, decodeString, decodeVoid } from "@/api/contract";
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
  return client.post("/auth/login", input, {
    auth: "none",
    decode: decodeApiAuthResult,
  });
}

export function registerApi(
  client: ApiClient,
  input: { qid: string; password: string; nickname: string; code: string },
): Promise<Result<ApiAuthResult>> {
  return client.post("/auth/register", input, {
    auth: "none",
    decode: decodeApiAuthResult,
  });
}

export function getMyUser(client: ApiClient): Promise<Result<ApiUser>> {
  return client.get("/users/me", { decode: decodeApiUser });
}

export function getUser(client: ApiClient, userId: string): Promise<Result<ApiUser>> {
  return client.get(`/users/${encodeURIComponent(userId)}`, {
    decode: decodeApiUser,
  });
}

export function listMyMembers(
  client: ApiClient,
  options: {
    offset: number;
    limit: number;
    includes?: readonly ("user" | "team")[] | undefined;
  },
): Promise<Result<ApiMember[]>> {
  return client.get("/members/me", {
    query: {
      offset: options.offset,
      limit: options.limit,
      incl: options.includes,
    },
    decode: (value) => decodeArray(value, decodeApiMember, "members"),
  });
}

export function listMembers(
  client: ApiClient,
  options: ListApiMembersOptions,
): Promise<Result<ApiMember[]>> {
  return client.get("/members", {
    query: {
      ownerId: options.ownerId,
      teamId: options.teamId,
      incl: options.includes,
      offset: options.offset,
      limit: options.limit,
      fuzzyNickname: options.nickname,
      role: options.role,
    },
    decode: (value) => decodeArray(value, decodeApiMember, "members"),
  });
}

export function updateMemberRoles(
  client: ApiClient,
  memberId: string,
  roles: number,
): Promise<Result<void>> {
  return client.put(
    `/members/${encodeURIComponent(memberId)}/roles`,
    { roles },
    {
      decode: decodeVoid,
    },
  );
}

export function joinTeam(client: ApiClient, code: string): Promise<Result<void>> {
  return client.post("/members/join", { code }, { decode: decodeVoid });
}

export function listTeams(
  client: ApiClient,
  options: { userId?: string | undefined; offset: number; limit: number },
): Promise<Result<ApiTeam[]>> {
  return client.get("/teams", {
    query: {
      userId: options.userId,
      offset: options.offset,
      limit: options.limit,
    },
    decode: (value) => decodeArray(value, decodeApiTeam, "teams"),
  });
}

export function getTeam(client: ApiClient, teamId: string): Promise<Result<ApiTeam>> {
  return client.get(`/teams/${encodeURIComponent(teamId)}`, {
    decode: decodeApiTeam,
  });
}

export function markSelfOnline(
  client: ApiClient,
  teamId: string,
  signal?: AbortSignal,
): Promise<Result<void>> {
  return client.put(`/teams/${encodeURIComponent(teamId)}/mark-self-online`, undefined, {
    decode: decodeVoid,
    ...(signal ? { signal } : {}),
  });
}

export function listOnlineUserIds(client: ApiClient, teamId: string): Promise<Result<string[]>> {
  return client.get(`/teams/${encodeURIComponent(teamId)}/online-users`, {
    decode: (value) => decodeArray(value, decodeString, "online user IDs"),
  });
}

export function updateTeam(
  client: ApiClient,
  teamId: string,
  input: { name?: string | undefined; description?: string | undefined },
): Promise<Result<void>> {
  return client.put(
    `/teams/${encodeURIComponent(teamId)}`,
    { id: teamId, ...input },
    { decode: decodeVoid },
  );
}

export function updateUserPassword(
  client: ApiClient,
  userId: string,
  input: { currentPassword: string; newPassword: string },
): Promise<Result<void>> {
  return client.put(`/users/${encodeURIComponent(userId)}/password`, input, { decode: decodeVoid });
}

export function allocateUserAvatar(
  client: ApiClient,
  userId: string,
  input: { imageHash: string; newByteLen: number; ext: string },
): Promise<Result<ApiImageUploadSlot | null>> {
  return client.post(`/users/${encodeURIComponent(userId)}/avatar/alloc`, input, {
    decode: decodeImageUploadAllocation,
  });
}

export function confirmUserAvatar(
  client: ApiClient,
  userId: string,
  imageVersion: number,
): Promise<Result<void>> {
  return client.post(
    `/users/${encodeURIComponent(userId)}/avatar/mark-uploaded`,
    { imageVersion },
    { decode: decodeVoid },
  );
}

export function allocateTeamAvatar(
  client: ApiClient,
  teamId: string,
  input: { imageHash: string; newByteLen: number; ext: string },
): Promise<Result<ApiImageUploadSlot | null>> {
  return client.post(`/teams/${encodeURIComponent(teamId)}/avatar/alloc`, input, {
    decode: decodeImageUploadAllocation,
  });
}

export function confirmTeamAvatar(
  client: ApiClient,
  teamId: string,
  imageVersion: number,
): Promise<Result<void>> {
  return client.post(
    `/teams/${encodeURIComponent(teamId)}/avatar/mark-uploaded`,
    { imageVersion },
    { decode: decodeVoid },
  );
}

function decodeImageUploadAllocation(value: unknown): ApiImageUploadSlot | null {
  const allocation = decodeObject(value, "image upload allocation");
  const slot = allocation["slot"];
  if (slot === null) return null;
  const decoded = decodeObject(slot, "image upload slot");
  const rawHeaders = decodeObject(decoded["headers"], "image upload slot.headers");
  const headers = Object.fromEntries(
    Object.entries(rawHeaders).map(([key, headerValue]) => [
      key,
      decodeString(headerValue, `image upload slot.headers.${key}`),
    ]),
  );
  return {
    putUrl: decodeString(decoded["putUrl"], "image upload slot.putUrl"),
    imageVersion: decodeNumber(decoded["imageVersion"], "image upload slot.imageVersion"),
    headers,
  };
}

export function logoutUser(client: ApiClient): Promise<Result<void>> {
  return client.post("/auth/logout", {}, { decode: decodeVoid });
}
