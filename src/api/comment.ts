import { api } from "./util";
import type { Result } from "@/types/utils/result";
import type { CommentInfo } from "@/types/comment";
import {
  unwrapRawCommentInfo,
  type RawCommentInfo,
} from "@/types/raw/comment";

type ListCommentsArgs = {
  teamId: string;
  offset: number;
  limit: number;
  includes?: string[];
};

export async function listComments(
  args: ListCommentsArgs,
): Promise<Result<CommentInfo[]>> {
  const result = await api.get<RawCommentInfo[]>(
    `/teams/${args.teamId}/comments`,
    {
      offset: args.offset,
      limit: args.limit,
      incl: args.includes,
    },
  );
  if (!result.success) return result;
  return {
    success: true,
    data: (result.data ?? []).map(unwrapRawCommentInfo),
  };
}

type CreateCommentArgs = {
  teamId: string;
  content: string;
};

type RawCreateCommentArgs = {
  team_id: string;
  content: string;
};

export async function createComment(
  args: CreateCommentArgs,
): Promise<Result<string>> {
  const result = await api.post<{ id: string }, RawCreateCommentArgs>(
    "/comments",
    {
      team_id: args.teamId,
      content: args.content,
    },
  );
  if (!result.success) return result;
  return { success: true, data: result.data!.id };
}
