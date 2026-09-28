import type { ApiClient } from "@/api/client";
import { getMyUser as getMyUserApi, getUser as getUserApi } from "@/api/identity/identity-api";
import type { Result } from "@/shared/utility/result";
import { toUserInfo } from "@/route/business/identity/api-adapter";
import type { UserInfo } from "@/route/business/identity/user";

export async function getMyUser(client: ApiClient): Promise<Result<UserInfo>> {
  const result = await getMyUserApi(client);
  return result.success ? { success: true, data: toUserInfo(result.data) } : result;
}

export async function getUser(client: ApiClient, userId: string): Promise<Result<UserInfo>> {
  const result = await getUserApi(client, userId);
  return result.success ? { success: true, data: toUserInfo(result.data) } : result;
}
