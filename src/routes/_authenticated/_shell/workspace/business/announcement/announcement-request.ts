import { api } from "@/routes/business/request";
import type { Result } from "@/shared/utility/result";
import type { AnnouncementInfo } from "@/routes/_authenticated/_shell/workspace/business/announcement/announcement";
import {
  type RawAnnouncementInfo,
  unwrapRawAnnouncementInfo,
} from "@/routes/_authenticated/_shell/workspace/business/announcement/raw-announcement";

type ListAnnouncementsArgs = {
  teamId: string;
  offset: number;
  limit: number;
};

export async function listAnnouncements(
  args: ListAnnouncementsArgs,
): Promise<Result<AnnouncementInfo[]>> {
  const result = await api.get<RawAnnouncementInfo[]>(`/teams/${args.teamId}/announcements`, {
    offset: args.offset,
    limit: args.limit,
    incl: ["user"],
  });
  if (!result.success) return result;
  return {
    success: true,
    data: result.data.map((item) => unwrapRawAnnouncementInfo(item)),
  };
}

type CreateAnnouncementArgs = {
  teamId: string;
  title: string;
  content: string;
};

type RawCreateAnnouncementArgs = {
  team_id: string;
  title: string;
  content: string;
};

export async function createAnnouncement(args: CreateAnnouncementArgs): Promise<Result<string>> {
  const result = await api.post<{ id: string }, RawCreateAnnouncementArgs>("/announcements", {
    team_id: args.teamId,
    title: args.title,
    content: args.content,
  });
  if (!result.success) return result;
  return { success: true, data: result.data.id };
}

type UpdateAnnouncementArgs = {
  title: string;
  content: string;
};

type RawUpdateAnnouncementArgs = UpdateAnnouncementArgs & {
  id: string;
};

export async function updateAnnouncement(
  announcementId: string,
  args: UpdateAnnouncementArgs,
): Promise<Result<undefined>> {
  const result = await api.put<undefined, RawUpdateAnnouncementArgs>(
    `/announcements/${announcementId}`,
    { id: announcementId, ...args },
  );
  if (!result.success) return result;
  return { success: true, data: undefined };
}

export async function deleteAnnouncement(announcementId: string): Promise<Result<undefined>> {
  const result = await api.delete<undefined>(`/announcements/${announcementId}`);
  if (!result.success) return result;
  return { success: true, data: undefined };
}
