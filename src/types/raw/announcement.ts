import type { AnnouncementInfo } from "../announcement";
import { unwrapRawUserInfo, type RawUserInfo } from "./user";

export type RawAnnouncementInfo = {
  id: string;
  team_id: string;
  user_id: string;
  user?: RawUserInfo;
  title: string;
  content: string;
  created_at: number;
};

export function unwrapRawAnnouncementInfo(
  raw: RawAnnouncementInfo,
): AnnouncementInfo {
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
