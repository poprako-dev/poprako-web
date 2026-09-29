import type { UserInfo } from "@/route/business/identity/user";

export type CommentInfo = {
  id: string;
  teamId: string;
  userId: string;
  user?: UserInfo | undefined;
  content: string;
  createdAt: number;
};

export type CommentCreatedResult = {
  id: string;
};
