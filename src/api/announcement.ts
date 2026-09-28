import type { ApiClient } from "@/api/client";
import { type ApiUser, decodeApiUser } from "@/api/identity-contract";
import {
  decodeArray,
  decodeNumber,
  decodeNullable,
  decodeObject,
  decodeString,
  decodeVoid,
} from "@/api/contract";
import type { Result } from "@/shared/utility/result";

export type AnnouncementResponse = {
  id: string;
  teamId: string;
  userId: string;
  user?: ApiUser | null | undefined;
  title: string;
  content: string;
  createdAt: number;
};

function decodeAnnouncement(value: unknown): AnnouncementResponse {
  const object = decodeObject(value, "announcement");
  return {
    id: decodeString(object["id"], "announcement.id"),
    teamId: decodeString(object["teamId"], "announcement.teamId"),
    userId: decodeString(object["userId"], "announcement.userId"),
    ...(Object.hasOwn(object, "user")
      ? { user: decodeNullable(object["user"], decodeApiUser, "announcement.user") }
      : {}),
    title: decodeString(object["title"], "announcement.title"),
    content: decodeString(object["content"], "announcement.content"),
    createdAt: decodeNumber(object["createdAt"], "announcement.createdAt"),
  };
}

export type ListAnnouncementsArgs = {
  teamId: string;
  offset: number;
  limit: number;
};

export async function listAnnouncements(
  client: ApiClient,
  args: ListAnnouncementsArgs,
): Promise<Result<AnnouncementResponse[]>> {
  const result = await client.get(`/teams/${args.teamId}/announcements`, {
    query: { offset: args.offset, limit: args.limit, incl: ["user"] },
    decode: (value) => decodeArray(value, decodeAnnouncement, "announcements"),
  });
  return result;
}

export type CreateAnnouncementArgs = {
  teamId: string;
  title: string;
  content: string;
};

export type UpdateAnnouncementArgs = {
  title: string;
  content: string;
};

function decodeCreatedAnnouncement(value: unknown): { id: string } {
  const object = decodeObject(value, "created announcement");
  return { id: decodeString(object["id"], "created announcement.id") };
}

export async function createAnnouncement(
  client: ApiClient,
  args: CreateAnnouncementArgs,
): Promise<Result<string>> {
  const result = await client.post("/announcements", args, { decode: decodeCreatedAnnouncement });
  return result.success ? { success: true, data: result.data.id } : result;
}

export function updateAnnouncement(
  client: ApiClient,
  announcementId: string,
  args: UpdateAnnouncementArgs,
): Promise<Result<undefined>> {
  return client.put(
    `/announcements/${announcementId}`,
    { id: announcementId, ...args },
    { decode: decodeVoid },
  );
}

export function deleteAnnouncement(
  client: ApiClient,
  announcementId: string,
): Promise<Result<undefined>> {
  return client.delete(`/announcements/${announcementId}`, { decode: decodeVoid });
}
