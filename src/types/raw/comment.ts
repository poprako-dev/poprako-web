import type { CommentInfo, CommentCreatedResult } from "../comment";
import { unwrapRawUserInfo, type RawUserInfo } from "./user";

export type RawCommentInfo = {
  id: string;
  team_id: string;
  user_id: string;
  user?: RawUserInfo;
  content: string;
  created_at: number;
};

export function unwrapRawCommentInfo(raw: RawCommentInfo): CommentInfo {
  return {
    id: raw.id,
    teamId: raw.team_id,
    userId: raw.user_id,
    user: raw.user ? unwrapRawUserInfo(raw.user) : undefined,
    content: raw.content,
    createdAt: raw.created_at,
  };
}

export type RawCommentCreatedResult = {
  id: string;
};

export function unwrapRawCommentCreatedResult(
  raw: RawCommentCreatedResult,
): CommentCreatedResult {
  return { id: raw.id };
}
