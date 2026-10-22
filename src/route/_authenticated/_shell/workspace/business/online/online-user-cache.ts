import type { ApiClient } from "@/api/client";
import { getUser } from "@/route/business/identity/user-request";
import type { UserInfo } from "@/route/business/identity/user";
import type { Result } from "@/shared/utility/result";

const CACHE_LIMIT = 128;
const CACHE_LIFETIME_MS = 5 * 60 * 1000;
type Entry = { user: UserInfo; expiresAt: number };
interface UserLoader {
  (userId: string, signal: AbortSignal): Promise<Result<UserInfo>>;
}

function isActive(signal: AbortSignal): boolean {
  return !signal.aborted;
}

export function createOnlineUserCache(client: ApiClient): UserLoader {
  const entries = new Map<string, Entry>();
  return async (userId, signal) => {
    const cached = entries.get(userId);
    if (cached && cached.expiresAt > Date.now()) {
      entries.delete(userId);
      entries.set(userId, cached);
      return { success: true, data: cached.user };
    }
    const result = await getUser(client, userId, signal);
    if (result.success && !signal.aborted) {
      entries.delete(userId);
      entries.set(userId, { user: result.data, expiresAt: Date.now() + CACHE_LIFETIME_MS });
      while (entries.size > CACHE_LIMIT) {
        const oldest = entries.keys().next().value;
        if (oldest !== undefined) entries.delete(oldest);
      }
    }
    return result;
  };
}

export async function loadOnlineUsers(
  load: UserLoader,
  userIds: string[],
  signal: AbortSignal,
): Promise<{ users: UserInfo[]; status: "ready" | "error" }> {
  const users: UserInfo[] = [];
  let index = 0;
  const failures: unknown[] = [];
  async function worker(): Promise<void> {
    while (isActive(signal)) {
      const userId = userIds[index++];
      if (!userId) return;
      try {
        const result = await load(userId, signal);
        if (result.success) users.push(result.data);
        else if (isActive(signal)) {
          failures.push(result.error);
          console.error("[TeamOnline] 获取在线用户资料失败:", result.error);
        }
      } catch (error) {
        if (!isActive(signal)) return;
        failures.push(error);
        console.error("[TeamOnline] 获取在线用户资料失败:", error);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(4, userIds.length) }, worker));
  users.sort((left, right) => left.name.localeCompare(right.name, "zh-CN"));
  return { users, status: failures.length > 0 ? "error" : "ready" };
}
