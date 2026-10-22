import type { ApiClient } from "@/api/client";
import type { ApiUser } from "@/api/identity-contract";
import type { Result } from "@/shared/utility/result";

export type CommentResponse = {
  id: string;
  teamId: string;
  userId: string;
  user?: ApiUser | null | undefined;
  content: string;
  createdAt: number;
};

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
  const result = await client.get<CommentResponse[]>(`/teams/${args.teamId}/comments`, {
    query: { offset: args.offset, limit: args.limit, incl: args.includes },
  });
  return result;
}

export type CreateCommentArgs = {
  teamId: string;
  content: string;
};

export async function createComment(
  client: ApiClient,
  args: CreateCommentArgs,
): Promise<Result<string>> {
  const result = await client.post<{ id: string }>("/comments", args);
  return result.success ? { success: true, data: result.data.id } : result;
}
