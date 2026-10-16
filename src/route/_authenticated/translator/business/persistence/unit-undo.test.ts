import { expect, test } from "vitest";
import { createUndoFixture, requiredUndoUnit, undoUnit } from "../test/unit-undo-fixture";
import { unitTranslatedText, normalizeUnitIndexes } from "../unit/unit";

test.each(Array.from({ length: 16 }, (_, mask) => mask))(
  "typing and deletion reverse independently with save schedule %i",
  async (mask) => {
    const { controller, pages, save } = createUndoFixture();
    const states = [[undoUnit("u1", "a")], [undoUnit("u1", "ab")], []];
    for (const [index, units] of states.entries()) {
      controller.commit(units);
      if (mask & (1 << index)) await controller.flush();
    }
    for (const text of ["ab", "a", ""]) {
      controller.undo();
      expect(controller.getSnapshot().units.map((u) => u.id)).toEqual(["u1"]);
      expect(unitTranslatedText(requiredUndoUnit(controller.getSnapshot().units)) ?? "").toBe(text);
      if (mask & 8) await controller.flush();
    }
    expect(controller.getSnapshot().canUndo).toBe(false);
    await controller.flush();
    expect(pages.get("p1")?.map((u) => u.id)).toEqual(["u1"]);
    expect(unitTranslatedText(requiredUndoUnit(pages.get("p1") ?? [])) ?? "").toBe("");
    expect(save.mock.calls.flatMap((call) => call[1].ops).some((op) => op.edit === "create")).toBe(
      false,
    );
  },
);

test("restoring a saved deletion includes text never sent before deletion", async () => {
  const { controller, save, pages } = createUndoFixture();
  controller.commit([undoUnit("u1", "ab")]);
  controller.commit([]);
  await controller.flush();
  expect(save.mock.calls[0]?.[1].ops).toEqual([{ edit: "delete", id: "u1" }]);
  controller.undo();
  await controller.flush();
  expect(save.mock.calls[1]?.[1].ops).toEqual([
    expect.objectContaining({
      edit: "patch",
      id: "u1",
      translation: { type: "assign", value: { translatedText: "ab" } },
    }),
  ]);
  expect(pages.get("p1")?.[0]?.translatedText).toBe("ab");
});

test("unsent creation and its undo cancel without a remote operation", async () => {
  const { controller, save } = createUndoFixture([]);
  controller.commit([undoUnit("local")]);
  controller.undo();
  await controller.flush();
  expect(save).not.toHaveBeenCalled();
  expect(controller.getSnapshot()).toMatchObject({ units: [], dirty: false, canUndo: false });
});

test("saved new unit keeps its identity through deletion, restoration, and all older undos", async () => {
  const { controller, pages, save } = createUndoFixture([]);
  controller.commit([undoUnit("local")]);
  controller.commit([undoUnit("local", "a")]);
  await controller.flush();
  const permanent = pages.get("p1")?.[0]?.id;
  controller.commit([]);
  await controller.flush();
  controller.undo();
  await controller.flush();
  expect(pages.get("p1")?.[0]?.id).toBe(permanent);
  expect(controller.getSnapshot().units[0]?.id).toBe("local");
  controller.undo();
  await controller.flush();
  controller.undo();
  await controller.flush();
  expect(pages.get("p1")).toEqual([]);
  expect(
    save.mock.calls.flatMap((call) => call[1].ops).filter((op) => op.edit === "create"),
  ).toHaveLength(1);
});

test("mixed content, flags, geometry, sorting, and deletion restore the document", async () => {
  const initial = normalizeUnitIndexes([undoUnit("a"), undoUnit("b"), undoUnit("c")]);
  const { controller, pages } = createUndoFixture(initial);
  const modified = {
    ...requiredUndoUnit(initial, 1),
    proofreadText: "revision",
    isProofread: true,
    isBubble: false,
    isFlagged: true,
    xCoord: 0.8,
    yCoord: 0.9,
  };
  controller.commit([requiredUndoUnit(initial, 0), modified, requiredUndoUnit(initial, 2)]);
  controller.commit([modified, requiredUndoUnit(initial, 2), requiredUndoUnit(initial, 0)]);
  controller.commit([requiredUndoUnit(initial, 2), requiredUndoUnit(initial, 0)]);
  await controller.flush();
  controller.undo();
  await controller.flush();
  expect(pages.get("p1")?.map((u) => u.id)).toEqual(["b", "c", "a"]);
  expect(pages.get("p1")?.[0]).toMatchObject({ ...modified, index: 0 });
  controller.undo();
  controller.undo();
  await controller.flush();
  expect(pages.get("p1")?.map((u) => u.id)).toEqual(["a", "b", "c"]);
  expect(pages.get("p1")?.[1]).toMatchObject({
    isProofread: false,
    isFlagged: false,
    isBubble: true,
    xCoord: 0.1,
    yCoord: 0.2,
  });
});

test("no-op and server metadata changes do not add undo entries", async () => {
  const { controller } = createUndoFixture();
  controller.commit([undoUnit()]);
  controller.commit([{ ...undoUnit(), translatorId: "server-author" }]);
  expect(controller.getSnapshot().canUndo).toBe(false);
  controller.commit([undoUnit("u1", "a")]);
  await controller.flush();
  controller.undo();
  expect(controller.getSnapshot().canUndo).toBe(false);
  controller.undo();
  expect(unitTranslatedText(requiredUndoUnit(controller.getSnapshot().units))).toBeNull();
});

test("new edits after undo continue backwards without replaying the undo itself", () => {
  const { controller } = createUndoFixture();
  controller.commit([undoUnit("u1", "a")]);
  controller.commit([undoUnit("u1", "ab")]);
  controller.undo();
  controller.commit([undoUnit("u1", "ac")]);
  controller.undo();
  expect(controller.getSnapshot().units[0]?.translatedText).toBe("a");
  controller.undo();
  expect(controller.getSnapshot().units[0]?.translatedText).toBe("");
});

test("page loads and explicit history boundaries clear the previous history", () => {
  const { controller } = createUndoFixture();
  controller.commit([undoUnit("u1", "a")]);
  controller.clearHistory();
  expect(controller.getSnapshot().canUndo).toBe(false);
  controller.commit([undoUnit("u1", "ab")]);
  controller.load("p2", [undoUnit("other")]);
  controller.undo();
  expect(controller.getSnapshot().units[0]?.id).toBe("other");
  expect(controller.getSnapshot().canUndo).toBe(false);
});
