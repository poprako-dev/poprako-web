import { describe, expect, test } from "vitest";
import { moveTermTarget, validateTermTargets } from "./termForm";

describe("term editor form", () => {
  test("requires at least one non-empty translation", () => {
    expect(validateTermTargets([])).toBe("译名不能为空");
    expect(validateTermTargets(["团长", " "])).toBe("译名不能为空");
  });

  test("rejects duplicate translations without case sensitivity", () => {
    expect(validateTermTargets(["Alice", " alice "])).toBe("译名不能重复");
    expect(validateTermTargets(["艾莉西亚", "阿莉西亚"])).toBeUndefined();
  });

  test("moves translations without mutating the original order", () => {
    const targets = ["甲", "乙", "丙"];
    expect(moveTermTarget(targets, 2, 0)).toEqual(["丙", "甲", "乙"]);
    expect(targets).toEqual(["甲", "乙", "丙"]);
  });
});
