import type { ApiClient } from "@/api/client";
import { listAnnouncements as listResponses } from "@/api/announcement";
import type { ListAnnouncementsArgs } from "@/api/announcement";
import type { AnnouncementInfo } from "./announcement";
import { toUserInfo } from "@/route/business/identity/api-adapter";
import type { Result } from "@/shared/utility/result";
export async function listAnnouncements(
  client: ApiClient,
  args: ListAnnouncementsArgs,
): Promise<Result<AnnouncementInfo[]>> {
  const result = await listResponses(client, args);
  return result.success
    ? {
        success: true,
        data: result.data.map(({ user, ...value }) => ({
          ...value,
          ...(user ? { user: toUserInfo(user) } : {}),
        })),
      }
    : result;
}
