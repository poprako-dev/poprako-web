import type { UserInfo } from "@/routes/business/identity/user";

export type AnnouncementInfo = {
  id: string;
  teamId: string;
  userId: string;
  user?: UserInfo | undefined;
  title: string;
  content: string;
  createdAt: number;
};
