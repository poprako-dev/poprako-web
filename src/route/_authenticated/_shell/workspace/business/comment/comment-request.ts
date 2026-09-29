import type { ApiClient } from "@/api/client";
import { listComments as listResponses } from "@/api/comment";
import type { ListCommentsArgs } from "@/api/comment";
import type { CommentInfo } from "./comment";
import { toUserInfo } from "@/route/business/identity/api-adapter";
import type { Result } from "@/shared/utility/result";
export async function listComments(
  client: ApiClient,
  args: ListCommentsArgs,
): Promise<Result<CommentInfo[]>> {
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
