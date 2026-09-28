import { describe, expect, it } from "vitest";
import { getMemberActivityColor } from "@/routes/_authenticated/_shell/member-list/business/member/activity-status";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const NOW = 2_000_000_000_000;

describe("getMemberActivityColor", () => {
  it("uses green through the first seven days", () => {
    expect(getMemberActivityColor(NOW - 7 * DAY_IN_MS, NOW)).toBe("bg-status-success");
  });

  it("uses yellow after seven days through thirty days", () => {
    expect(getMemberActivityColor(NOW - 7 * DAY_IN_MS - 1, NOW)).toBe("bg-amber-200");
    expect(getMemberActivityColor(NOW - 30 * DAY_IN_MS, NOW)).toBe("bg-amber-200");
  });

  it("uses gray after thirty days or when activity is unavailable", () => {
    expect(getMemberActivityColor(NOW - 30 * DAY_IN_MS - 1, NOW)).toBe("bg-border");
    expect(getMemberActivityColor(undefined, NOW)).toBe("bg-border");
  });
});
