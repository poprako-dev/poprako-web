import { expect, test, vi } from "vitest";
import { createUndoFixture, deferredUndoSave, undoUnit } from "../test/unit-undo-fixture";

test("an earlier text save response cannot undo a later delete-and-restore", async () => {
  const { controller, save, backend, pages } = createUndoFixture();
  const gate = deferredUndoSave();
  save.mockImplementationOnce(async (...args) => {
    await gate.promise;
    return backend(...args);
  });
  controller.commit([undoUnit("u1", "a")]);
  controller.commit([undoUnit("u1", "ab")]);
  const saving = controller.saveOnce();
  await vi.waitFor(() => {
    expect(save).toHaveBeenCalledOnce();
  });
  controller.commit([]);
  controller.undo();
  expect(controller.getSnapshot().units[0]).toMatchObject({ id: "u1", translatedText: "ab" });
  gate.resolve();
  await saving;
  expect(controller.getSnapshot().units[0]).toMatchObject({ id: "u1", translatedText: "ab" });
  for (const translatedText of ["a", ""]) {
    controller.undo();
    expect(controller.getSnapshot().units[0]?.translatedText).toBe(translatedText);
  }
  await controller.flush();
  expect(pages.get("p1")).toHaveLength(1);
  expect(pages.get("p1")?.[0]?.translatedText ?? "").toBe("");
  expect(controller.getSnapshot().canUndo).toBe(false);
});

test("a restored and edited middle unit survives reload with its original identity and order", async () => {
  const initial = [undoUnit("u0"), undoUnit("u1", "ab"), undoUnit("u2")];
  const { controller, pages, reload, save } = createUndoFixture(initial);
  controller.commit(initial.filter((unit) => unit.id !== "u1"));
  await controller.flush();
  controller.undo();
  controller.commit(
    controller
      .getSnapshot()
      .units.map((unit) => (unit.id === "u1" ? { ...unit, translatedText: "abc" } : unit)),
  );
  await controller.flush();
  controller.load("p1", await reload("p1"));
  expect(controller.getSnapshot().units.map((unit) => unit.id)).toEqual(["u0", "u1", "u2"]);
  expect(pages.get("p1")?.[1]?.translatedText).toBe("abc");
  expect(
    save.mock.calls.flatMap((call) => call[1].ops).filter((op) => op.edit === "create"),
  ).toEqual([]);
  expect(controller.getSnapshot().canUndo).toBe(false);
});
