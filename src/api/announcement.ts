import type { ApiClient } from "@/api/client";
import type { ApiUser } from "@/api/identity-contract";
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

export type ListAnnouncementsArgs = {
  teamId: string;
  offset: number;
  limit: number;
};

export async function listAnnouncements(
  client: ApiClient,
  args: ListAnnouncementsArgs,
): Promise<Result<AnnouncementResponse[]>> {
  const result = await client.get<AnnouncementResponse[]>(`/teams/${args.teamId}/announcements`, {
    query: { offset: args.offset, limit: args.limit, incl: ["user"] },
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

export async function createAnnouncement(
  client: ApiClient,
  args: CreateAnnouncementArgs,
): Promise<Result<string>> {
  const result = await client.post<{ id: string }>("/announcements", args);
  return result.success ? { success: true, data: result.data.id } : result;
}

export function updateAnnouncement(
  client: ApiClient,
  announcementId: string,
  args: UpdateAnnouncementArgs,
): Promise<Result<undefined>> {
  return client.put<undefined>(`/announcements/${announcementId}`, { id: announcementId, ...args });
}

export function deleteAnnouncement(
  client: ApiClient,
  announcementId: string,
): Promise<Result<undefined>> {
  return client.delete<undefined>(`/announcements/${announcementId}`);
}
