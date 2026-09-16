import { describe, expect, test } from "vitest";

import { buildUnitDiff } from "./unitDiff";
import type { UnitInfo } from "@/types/unit";
import { normalizeUnitIndexes } from "@/types/unit";

function unitAt(units: UnitInfo[], index: number): UnitInfo {
  const unit = units[index];
  if (!unit) {throw new Error("测试 Unit 缺失");}
  return unit;
}

const localUnit: UnitInfo = {
  id: "local_1",
  xCoord: 0.1,
  yCoord: 0.2,
  index: 0,
  isBubble: true,
  isProofread: false,
};

describe("unit diff", () => {
  test("clears translation and preserves proofreading status when text is removed", () => {
    const baseline: UnitInfo[] = [{
      ...localUnit,
      id: "unit_1",
      translatedText: "existing translation",
      translatorId: "translator_1",
      isProofread: true,
      proofreadText: "existing revision",
      proofreaderId: "proofreader_1",
    }];
    const current: UnitInfo[] = [{
      ...unitAt(baseline, 0),
      translatedText: undefined,
      translatorId: undefined,
      proofreadText: undefined,
      proofreaderId: undefined,
    }];

    expect(buildUnitDiff(current, baseline)).toEqual({
      ops: [{
        edit: "patch",
        id: "unit_1",
        nextId: { type: "skip" },
        translation: { type: "clear" },
        revision: {
          type: "assign",
          value: { isProofread: true, proofreadText: undefined },
        },
      }],
    });
  });
  test("updates proofreading status without changing revision text", () => {
    const baseline: UnitInfo[] = [{
      ...localUnit,
      id: "unit_1",
      isProofread: true,
      proofreadText: "existing revision",
    }];
    const current: UnitInfo[] = [{ ...unitAt(baseline, 0), isProofread: false }];

    expect(buildUnitDiff(current, baseline)).toEqual({
      ops: [{
        edit: "patch",
        id: "unit_1",
        nextId: { type: "skip" },
        translation: { type: "skip" },
        revision: {
          type: "assign",
          value: { isProofread: false, proofreadText: "existing revision" },
        },
      }],
    });
  });
  test("normalizes indexes and expresses order through nextId edits", () => {
    const baseline = normalizeUnitIndexes([
      { ...localUnit, id: "unit_a", index: 10 },
      { ...localUnit, id: "unit_b", index: 10 },
      { ...localUnit, id: "unit_c", index: 80 },
    ]);
    const current = normalizeUnitIndexes([
      { ...unitAt(baseline, 1), xCoord: 0.5, index: 99 },
      { ...localUnit, id: "local_new", index: 99 },
      { ...unitAt(baseline, 0), index: 5 },
    ]);

    expect(current.map((unit) => unit.index)).toEqual([0, 1, 2]);
    expect(buildUnitDiff(current, baseline)).toEqual({
      ops: [
        { edit: "delete", id: "unit_c" },
        {
          edit: "patch",
          id: "unit_a",
          nextId: { type: "clear" },
          translation: { type: "skip" },
          revision: { type: "skip" },
        },
        {
          edit: "patch",
          id: "unit_b",
          nextId: { type: "assign", value: "local_new" },
          coord: { xCoord: 0.5, yCoord: 0.2 },
          translation: { type: "skip" },
          revision: { type: "skip" },
        },
        {
          edit: "create",
          localId: "local_new",
          nextId: "unit_a",
          isBubble: true,
          coord: { xCoord: 0.1, yCoord: 0.2 },
        },
      ],
    });
  });
});
