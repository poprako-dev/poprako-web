import type { ApiClient } from "@/api/client";
import { type ApiUser, decodeApiUser } from "@/api/identity-contract";
import {
  decodeArray,
  decodeNumber,
  decodeNullable,
  decodeObject,
  decodeString,
} from "@/api/contract";
import type { Result } from "@/shared/utility/result";

export type CommentResponse = {
  id: string;
  teamId: string;
  userId: string;
  user?: ApiUser | null | undefined;
  content: string;
  createdAt: number;
};

function decodeComment(value: unknown): CommentResponse {
  const object = decodeObject(value, "comment");
  return {
    id: decodeString(object["id"], "comment.id"),
    teamId: decodeString(object["teamId"], "comment.teamId"),
    userId: decodeString(object["userId"], "comment.userId"),
    ...(Object.hasOwn(object, "user")
      ? { user: decodeNullable(object["user"], decodeApiUser, "comment.user") }
      : {}),
    content: decodeString(object["content"], "comment.content"),
    createdAt: decodeNumber(object["createdAt"], "comment.createdAt"),
  };
}

export type ListCommentsArgs = {
  teamId: string;
  offset: number;
  limit: number;
  includes?: string[] | undefined;
};

export async function listComments(
  client: ApiClient,
  args: ListCommentsArgs,
): Promise<Result<CommentResponse[]>> {
  const result = await client.get(`/teams/${args.teamId}/comments`, {
    query: { offset: args.offset, limit: args.limit, incl: args.includes },
    decode: (value) => decodeArray(value, decodeComment, "comments"),
  });
  return result;
}

export type CreateCommentArgs = {
  teamId: string;
  content: string;
};

function decodeCreatedComment(value: unknown): { id: string } {
  const object = decodeObject(value, "created comment");
  return { id: decodeString(object["id"], "created comment.id") };
}

export async function createComment(
  client: ApiClient,
  args: CreateCommentArgs,
): Promise<Result<string>> {
  const result = await client.post("/comments", args, { decode: decodeCreatedComment });
  return result.success ? { success: true, data: result.data.id } : result;
}
