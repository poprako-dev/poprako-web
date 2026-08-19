import { describe, expect, test, vi } from "vitest";
import type { UnitInfo } from "@/types/unit";
import type { UserInfo } from "@/types/user";
import {
  UnitContributorCache,
  unitContributorIds,
  type UnitUserResolver,
} from "./unitContributorCache";

function makeUser(id: string): UserInfo {
  return {
    id,
    qq: "",
    name: id,
    avatarUrl: "",
    isSuperAdmin: false,
    lastActiveAt: 0,
    createdAt: 0,
    updatedAt: 0,
  };
}

function makeUnit(
  id: string,
  translatorId?: string,
  proofreaderId?: string,
): UnitInfo {
  return {
    id,
    index: 0,
    xCoord: 0,
    yCoord: 0,
    isBubble: true,
    isProofread: false,
    translatorId,
    proofreaderId,
  };
}

describe("unitContributorIds", () => {
  test("deduplicates translator and proofreader ids", () => {
    const units = [
      makeUnit("unit_1", "user_1", "user_2"),
      makeUnit("unit_2", "user_1", "user_1"),
    ];

    expect(unitContributorIds(units)).toEqual(["user_1", "user_2"]);
  });
});

describe("UnitContributorCache", () => {
  test("shares pending work and caches successful users", async () => {
    const user = makeUser("user_1");
    const resolver = vi.fn<UnitUserResolver>().mockResolvedValue({
      success: true,
      data: user,
    });
    const cache = new UnitContributorCache();

    const first = cache.resolve(user.id, resolver);
    const second = cache.resolve(user.id, resolver);

    await expect(first).resolves.toBe(user);
    await expect(second).resolves.toBe(user);
    await expect(cache.resolve(user.id, resolver)).resolves.toBe(user);
    expect(cache.get(user.id)).toBe(user);
    expect(resolver).toHaveBeenCalledOnce();
  });

  test("does not expose or retry failed users", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const resolver = vi.fn<UnitUserResolver>().mockResolvedValue({
      success: false,
      error: "not found",
    });
    const cache = new UnitContributorCache();

    await expect(cache.resolve("missing", resolver)).resolves.toBeUndefined();
    await expect(cache.resolve("missing", resolver)).resolves.toBeUndefined();
    expect(cache.get("missing")).toBeUndefined();
    expect(resolver).toHaveBeenCalledOnce();
    expect(consoleError).toHaveBeenCalledOnce();

    consoleError.mockRestore();
  });
});
