import type { UserInfo } from "./user";

export type CommentInfo = {
  id: string;
  teamId: string;
  userId: string;
  user?: UserInfo;
  content: string;
  createdAt: number;
};

export type CommentCreatedResult = {
  id: string;
};
