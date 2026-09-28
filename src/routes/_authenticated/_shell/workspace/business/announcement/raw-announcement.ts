import type { AnnouncementInfo } from "@/routes/_authenticated/_shell/workspace/business/announcement/announcement";
import { type RawUserInfo, unwrapRawUserInfo } from "@/routes/business/identity/raw-user";

export type RawAnnouncementInfo = {
  id: string;
  team_id: string;
  user_id: string;
  user?: RawUserInfo | undefined;
  title: string;
  content: string;
  created_at: number;
};

export function unwrapRawAnnouncementInfo(raw: RawAnnouncementInfo): AnnouncementInfo {
  return {
    id: raw.id,
    teamId: raw.team_id,
    userId: raw.user_id,
    user: raw.user ? unwrapRawUserInfo(raw.user) : undefined,
    title: raw.title,
    content: raw.content,
    createdAt: raw.created_at,
  };
}
