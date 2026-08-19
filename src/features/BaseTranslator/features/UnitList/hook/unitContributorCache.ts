import {
  unitProofreaderId,
  unitTranslatorId,
  type UnitInfo,
} from "@/types/unit";
import type { UserInfo } from "@/types/user";
import type { Result } from "@/types/utils/result";

export type UnitUserResolver = (
  userId: string,
) => Promise<Result<UserInfo>>;

export function unitContributorIds(units: UnitInfo[]): string[] {
  const ids = new Set<string>();

  units.forEach((unit) => {
    const translatorId = unitTranslatorId(unit);
    const proofreaderId = unitProofreaderId(unit);
    if (translatorId) ids.add(translatorId);
    if (proofreaderId) ids.add(proofreaderId);
  });

  return Array.from(ids);
}

export class UnitContributorCache {
  private readonly users = new Map<string, UserInfo>();
  private readonly pending = new Map<string, Promise<UserInfo | undefined>>();
  private readonly failed = new Set<string>();

  get(userId: string | null): UserInfo | undefined {
    return userId ? this.users.get(userId) : undefined;
  }

  resolve(
    userId: string,
    resolver: UnitUserResolver,
  ): Promise<UserInfo | undefined> {
    const user = this.users.get(userId);
    if (user) return Promise.resolve(user);
    if (this.failed.has(userId)) return Promise.resolve(undefined);

    const pending = this.pending.get(userId);
    if (pending) return pending;

    const request = resolver(userId)
      .then((result) => {
        if (!result.success) {
          this.failed.add(userId);
          console.error("[UnitList] 解析 Unit 人员失败", {
            userId,
            error: result.error,
          });
          return undefined;
        }

        this.users.set(userId, result.data);
        return result.data;
      })
      .catch((error: unknown) => {
        this.failed.add(userId);
        console.error("[UnitList] 解析 Unit 人员异常", { userId, error });
        return undefined;
      })
      .finally(() => {
        this.pending.delete(userId);
      });

    this.pending.set(userId, request);
    return request;
  }
}
