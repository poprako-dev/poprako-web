import { describe, expect, test } from "vitest";

import {
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
    isProofread: false,
  }));
}

function expectOrder(units: UnitInfo[], ids: string[]) {
  expect(units.map(unitId)).toEqual(ids);
  expect(units.map(unitIndex)).toEqual(ids.map((_, index) => index));
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
      ...makeUnits()[0],
      translatorId: "translator_1",
      proofreaderId: "proofreader_1",
    };

    expect(unitTranslatorId(unit)).toBe("translator_1");
    expect(unitProofreaderId(unit)).toBe("proofreader_1");
  });

  test("returns null when a contributor id is absent", () => {
    const unit = makeUnits()[0];

    expect(unitTranslatorId(unit)).toBeNull();
    expect(unitProofreaderId(unit)).toBeNull();
  });
});
