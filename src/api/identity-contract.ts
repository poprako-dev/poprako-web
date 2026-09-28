import { decodeBoolean, decodeNumber, decodeObject, decodeString } from "@/api/contract";

export type ApiUser = {
  id: string;
  qid: string;
  nickname: string;
  avatarUrl: string | null;
  avatarThumbnailUrl?: string | null | undefined;
  isSadmin: boolean;
  lastActiveAt: number;
  createdAt: number;
  updatedAt: number;
};

export type ApiTeam = {
  id: string;
  name: string;
  description: string;
  avatarUrl: string | null;
  avatarThumbnailUrl?: string | null | undefined;
  createdAt: number;
  updatedAt: number;
};

export type ApiMember = {
  id: string;
  userId: string;
  teamId: string;
  user?: ApiUser | null | undefined;
  team?: ApiTeam | null | undefined;
  nickname: string;
  lastActiveAt: number;
  roles: number;
};

export type ApiAuthResult = { token: string; userId: string };

export function decodeApiUser(value: unknown): ApiUser {
  const raw = decodeObject(value, "user");
  return {
    id: decodeString(raw["id"], "user.id"),
    qid: decodeString(raw["qid"], "user.qid"),
    nickname: decodeString(raw["nickname"], "user.nickname"),
    avatarUrl: decodeOptionalNullableString(raw, "avatarUrl", "user.avatarUrl"),
    ...(Object.hasOwn(raw, "avatarThumbnailUrl")
      ? {
          avatarThumbnailUrl: decodeNullableString(
            raw["avatarThumbnailUrl"],
            "user.avatarThumbnailUrl",
          ),
        }
      : {}),
    isSadmin: decodeBoolean(raw["isSadmin"], "user.isSadmin"),
    lastActiveAt: decodeNumber(raw["lastActiveAt"], "user.lastActiveAt"),
    createdAt: decodeNumber(raw["createdAt"], "user.createdAt"),
    updatedAt: decodeNumber(raw["updatedAt"], "user.updatedAt"),
  };
}

export function decodeApiTeam(value: unknown): ApiTeam {
  const raw = decodeObject(value, "team");
  return {
    id: decodeString(raw["id"], "team.id"),
    name: decodeString(raw["name"], "team.name"),
    description: decodeString(raw["description"], "team.description"),
    avatarUrl: decodeOptionalNullableString(raw, "avatarUrl", "team.avatarUrl"),
    ...(Object.hasOwn(raw, "avatarThumbnailUrl")
      ? {
          avatarThumbnailUrl: decodeNullableString(
            raw["avatarThumbnailUrl"],
            "team.avatarThumbnailUrl",
          ),
        }
      : {}),
    createdAt: decodeNumber(raw["createdAt"], "team.createdAt"),
    updatedAt: decodeNumber(raw["updatedAt"], "team.updatedAt"),
  };
}

export function decodeApiMember(value: unknown): ApiMember {
  const raw = decodeObject(value, "member");
  return {
    id: decodeString(raw["id"], "member.id"),
    userId: decodeString(raw["userId"], "member.userId"),
    teamId: decodeString(raw["teamId"], "member.teamId"),
    ...(Object.hasOwn(raw, "user")
      ? { user: raw["user"] === null ? null : decodeApiUser(raw["user"]) }
      : {}),
    ...(Object.hasOwn(raw, "team")
      ? { team: raw["team"] === null ? null : decodeApiTeam(raw["team"]) }
      : {}),
    nickname: decodeString(raw["nickname"], "member.nickname"),
    lastActiveAt: decodeNumber(raw["lastActiveAt"], "member.lastActiveAt"),
    roles: decodeNumber(raw["roles"], "member.roles"),
  };
}

export function decodeApiAuthResult(value: unknown): ApiAuthResult {
  const raw = decodeObject(value, "authentication result");
  return {
    token: decodeString(raw["token"], "authentication result.token"),
    userId: decodeString(raw["userId"], "authentication result.userId"),
  };
}

function decodeNullableString(value: unknown, label: string): string | null {
  if (value === null) return null;
  return decodeString(value, label);
}

function decodeOptionalNullableString(
  object: Record<string, unknown>,
  key: string,
  label: string,
): string | null {
  return Object.hasOwn(object, key) ? decodeNullableString(object[key], label) : null;
}
