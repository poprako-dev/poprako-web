import { describe, expect, test } from "vitest";

import {
  applyUnitUpdates,
  moveUnitToIndex,
  unitId,
  unitIndex,
  unitProofreaderId,
  unitTranslatorId,
  type UnitInfo,
} from "./unit";

function makeUnits(): UnitInfo[] {
  return ["unit_a", "unit_b", "unit_c"].map((id, index) => ({
    id,
    xCoord: 0,
    yCoord: index / 10,
    index,
    isBubble: true,
    isFlagged: false,
    isProofread: false,
  }));
}

function firstUnit(units: UnitInfo[]): UnitInfo {
  const unit = units[0];
  if (!unit) {throw new Error("测试 Unit 缺失");}
  return unit;
}

function expectOrder(units: UnitInfo[], ids: string[]) {
  expect(units.map((unit) => unitId(unit))).toEqual(ids);
  expect(units.map((unit) => unitIndex(unit))).toEqual(ids.map((_, index) => index));
}

describe("moveUnitToIndex", () => {
  test("moves a unit upward and downward", () => {
    expectOrder(moveUnitToIndex(makeUnits(), "unit_c", 1), [
      "unit_a",
      "unit_c",
      "unit_b",
    ]);
    expectOrder(moveUnitToIndex(makeUnits(), "unit_a", 1), [
      "unit_b",
      "unit_a",
      "unit_c",
    ]);
  });

  test("clamps moves to the first and last positions", () => {
    expectOrder(moveUnitToIndex(makeUnits(), "unit_c", -10), [
      "unit_c",
      "unit_a",
      "unit_b",
    ]);
    expectOrder(moveUnitToIndex(makeUnits(), "unit_a", 99), [
      "unit_b",
      "unit_c",
      "unit_a",
    ]);
  });

  test("normalizes indexes when the position is unchanged", () => {
    const units = makeUnits().map((unit) => ({ ...unit, index: 99 }));

    expectOrder(moveUnitToIndex(units, "unit_b", 1), [
      "unit_a",
      "unit_b",
      "unit_c",
    ]);
  });

  test("returns the original units for an unknown id", () => {
    const units = makeUnits();

    expect(moveUnitToIndex(units, "missing", 1)).toBe(units);
  });
});

describe("unit contributor ids", () => {
  test("returns contributor ids through the unit accessors", () => {
    const unit = {
      ...firstUnit(makeUnits()),
      translatorId: "translator_1",
      proofreaderId: "proofreader_1",
    };

    expect(unitTranslatorId(unit)).toBe("translator_1");
    expect(unitProofreaderId(unit)).toBe("proofreader_1");
  });

  test("returns null when a contributor id is absent", () => {
    const unit = firstUnit(makeUnits());

    expect(unitTranslatorId(unit)).toBeNull();
    expect(unitProofreaderId(unit)).toBeNull();
  });
});

describe("proofreading state", () => {
  test("keeps the proofreading status when revision text is cleared", () => {
    const unit = {
      ...firstUnit(makeUnits()),
      isProofread: true,
      proofreadText: "revision",
    };

    expect(applyUnitUpdates(unit, { proofreadText: "" })).toMatchObject({
      isProofread: true,
      proofreadText: "",
    });
  });

  test("keeps revision text when proofreading status changes", () => {
    const unit = {
      ...firstUnit(makeUnits()),
      isProofread: true,
      proofreadText: "revision",
    };

    expect(applyUnitUpdates(unit, { isProofread: false })).toMatchObject({
      isProofread: false,
      proofreadText: "revision",
    });
  });
});
