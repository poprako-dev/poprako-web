import { expect, test, vi } from "vitest";
import { createUndoFixture, deferredUndoSave, undoUnit } from "../test/unit-undo-fixture";

test("mixed restoration, creation, and reordering place successors before predecessors", async () => {
  const initial = ["a", "b", "c", "d"].map((id) => undoUnit(id));
  const { controller, pages, save } = createUndoFixture(initial);
  controller.commit([undoUnit("a"), undoUnit("c")]);
  await controller.flush();
  controller.undo();
  controller.commit(["d", "new", "b", "a", "c"].map((id) => undoUnit(id)));
  await controller.flush();
  const permanent = pages.get("p1")?.[1]?.id;
  expect(pages.get("p1")?.map((u) => u.id)).toEqual(["d", permanent, "b", "a", "c"]);
  expect(save.mock.calls[1]?.[1].ops.map((op) => op.edit)).toEqual(["patch", "create", "patch"]);
  controller.undo();
  await controller.flush();
  expect(pages.get("p1")?.map((u) => u.id)).toEqual(["a", "b", "c", "d"]);
  controller.undo();
  await controller.flush();
  expect(pages.get("p1")?.map((u) => u.id)).toEqual(["a", "b", "c", "d"]);
  expect(controller.getSnapshot().canUndo).toBe(false);
});

test("undo during a split 200-op replacement restores the original hundred IDs", async () => {
  const initial = Array.from({ length: 100 }, (_, i) => undoUnit(`old-${String(i)}`));
  const { controller, pages, backend, save } = createUndoFixture(initial);
  const gate = deferredUndoSave();
  save.mockImplementationOnce(backend).mockImplementationOnce(async (...args) => {
    await gate.promise;
    return backend(...args);
  });
  controller.commit(initial.map((unit, i) => ({ ...unit, id: `new-${String(i)}` })));
  const auto = controller.saveOnce();
  await vi.waitFor(() => {
    expect(save).toHaveBeenCalledTimes(2);
  });
  controller.undo();
  const manual = controller.flush();
  gate.resolve();
  await Promise.all([auto, manual]);
  expect(pages.get("p1")?.map((u) => u.id)).toEqual(initial.map((u) => u.id));
  expect(save.mock.calls.map((call) => call[1].ops[0]?.edit)).toEqual([
    "delete",
    "create",
    "delete",
    "patch",
  ]);
  expect(save.mock.calls.every((call) => call[1].ops.length === 100)).toBe(true);
  expect(controller.getSnapshot()).toMatchObject({ dirty: false, canUndo: false });
});
