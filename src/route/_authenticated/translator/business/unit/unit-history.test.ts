import { expect, test, vi } from "vitest";
import { type UnitInfo, normalizeUnitIndexes } from "./unit";
import { UnitHistory } from "./unit-history";
import { reverseUnitContent } from "./unit-history-content";

function makeUnit(id = "u", index = 0): UnitInfo {
  return {
    id,
    index,
    xCoord: 0.1,
    yCoord: 0.2,
    isBubble: true,
    isFlagged: false,
    isProofread: false,
    translatedText: "before",
    proofreadText: "revision",
    translationNote: "note",
    typographyNote: "layout",
    translatorId: "translator",
    proofreaderId: "proofreader",
  };
}

function requiredUnit(units: UnitInfo[] | undefined, index = 0): UnitInfo {
  const unit = units?.[index];
  if (!unit) throw new Error("测试 Unit 缺失");
  return unit;
}

test("stores only changed editable fields", () => {
  const before = makeUnit();
  const after = { ...before, translatedText: "after", translatorId: "new author" };

  expect(reverseUnitContent(before, after)).toEqual({ translatedText: "before" });
  expect(reverseUnitContent(before, { ...before, index: 5 })).toBeUndefined();
});

test("ignores equivalent empty values, metadata, and whitespace-only notes", () => {
  const history = new UnitHistory();
  const before = { ...makeUnit(), translatedText: undefined, translationNote: null };
  const after = { ...before, translatedText: "", translationNote: "  ", translatorId: "other" };

  expect(history.record([before], [after])).toBe(false);
  expect(history.canUndo).toBe(false);
  expect(history.undo([after])).toBeUndefined();
});

test("undo changes only recorded fields and retains the latest authors", () => {
  const history = new UnitHistory();
  const before = makeUnit();
  const after = { ...before, translatedText: "after" };
  history.record([before], [after]);
  const current = {
    ...after,
    translatedText: "newer remote text",
    translatorId: "server translator",
    proofreaderId: "server proofreader",
    typographyNote: "server layout",
    proofreadText: "server revision",
  };

  expect(requiredUnit(history.undo([current]))).toEqual({
    ...current,
    translatedText: "before",
  });
  expect(history.canUndo).toBe(false);
});

test("restoring empty text clears its author without changing proofreading status", () => {
  const history = new UnitHistory();
  const before = { ...makeUnit(), translatedText: undefined, proofreadText: undefined };
  const after = { ...makeUnit(), isProofread: true };
  history.record([before], [after]);

  expect(requiredUnit(history.undo([after]))).toMatchObject({
    translatedText: "",
    translatorId: undefined,
    proofreadText: "",
    proofreaderId: undefined,
    isProofread: false,
  });
});

test("a batch is one undo entry and editing after undo keeps earlier entries", () => {
  const history = new UnitHistory();
  const before = [makeUnit("a"), makeUnit("b", 1)];
  const first = before.map((unit) => ({ ...unit, isProofread: true }));
  const second = first.map((unit) => ({ ...unit, isFlagged: true }));
  history.record(before, first);
  history.record(first, second);
  const restored = history.undo(second);
  expect(restored).toEqual(first);
  const third = first.map((unit) => ({ ...unit, isBubble: false }));
  history.record(restored ?? [], third);

  expect(history.undo(third)).toEqual(first);
  expect(history.undo(first)).toEqual(before);
  expect(history.canUndo).toBe(false);
});

test("restores deletion, removes creation, and restores order in one step", () => {
  const history = new UnitHistory();
  const before = [makeUnit("a"), makeUnit("b", 1), makeUnit("c", 2)];
  const after = normalizeUnitIndexes([
    requiredUnit(before, 2),
    makeUnit("new"),
    requiredUnit(before),
  ]);
  history.record(before, after);

  expect(history.undo(after)).toEqual(before);
  expect(history.canUndo).toBe(false);
});

test("deleted units retain current author metadata through restoration", () => {
  const history = new UnitHistory();
  const before = makeUnit();
  const latest = { ...before, translatedText: "after", translatorId: "server author" };
  history.record([before], [{ ...before, translatedText: "after" }]);
  history.record([latest], []);
  const restored = history.undo([]);

  expect(requiredUnit(restored)).toEqual(latest);
  expect(requiredUnit(history.undo(restored ?? []))).toEqual({
    ...latest,
    translatedText: "before",
  });
});

test("clear removes all earlier undo entries", () => {
  const history = new UnitHistory();
  const before = makeUnit();
  const after = { ...before, isFlagged: true };
  history.record([before], [after]);
  history.clear();

  expect(history.canUndo).toBe(false);
  expect(history.undo([after])).toBeUndefined();
});

test("a single edit in 100 units does not read or recreate the other 99 units", () => {
  const history = new UnitHistory();
  const readUnchangedText = vi.fn(() => "before");
  const before = Array.from({ length: 100 }, (_, index) => {
    const unit = makeUnit(String(index), index);
    if (index < 99) {
      Object.defineProperty(unit, "translatedText", { get: readUnchangedText, enumerable: true });
    }
    return unit;
  });
  const after = before.map((unit, index) =>
    index === 99 ? { ...unit, translatedText: "after" } : unit,
  );

  expect(history.record(before, after)).toBe(true);
  expect(readUnchangedText).not.toHaveBeenCalled();
  const restored = history.undo(after);
  expect(readUnchangedText).not.toHaveBeenCalled();
  for (let index = 0; index < 99; index += 1) {
    expect(restored?.[index]).toBe(before[index]);
  }
  expect(requiredUnit(restored, 99).translatedText).toBe("before");
});
