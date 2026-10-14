import { expect, test, vi } from "vitest";
import { createUndoFixture, deferredUndoSave, undoUnit } from "../test/unit-undo-fixture";

test("manual save joins auto save and sends the inverse text change afterwards", async () => {
  const { controller, save, backend, pages } = createUndoFixture();
  const gate = deferredUndoSave();
  save.mockImplementationOnce(async (...args) => {
    await gate.promise;
    return backend(...args);
  });
  controller.commit([undoUnit("u1", "a")]);
  const auto = controller.saveOnce();
  await vi.waitFor(() => {
    expect(save).toHaveBeenCalledTimes(1);
  });
  controller.undo();
  const manual = controller.flush();
  gate.resolve();
  await Promise.all([auto, manual]);
  expect(save).toHaveBeenCalledTimes(2);
  expect(save.mock.calls[1]?.[1].ops[0]).toMatchObject({
    edit: "patch",
    id: "u1",
    translation: { type: "clear" },
  });
  expect(pages.get("p1")?.[0]?.translatedText).toBeUndefined();
  expect(controller.getSnapshot()).toMatchObject({ dirty: false, canUndo: false });
});

test("undoing a deletion in flight restores its original ID and unsent text", async () => {
  const { controller, save, backend, pages } = createUndoFixture();
  const gate = deferredUndoSave();
  save.mockImplementationOnce(async (...args) => {
    await gate.promise;
    return backend(...args);
  });
  controller.commit([undoUnit("u1", "ab")]);
  controller.commit([]);
  const auto = controller.saveOnce();
  await vi.waitFor(() => {
    expect(save).toHaveBeenCalledTimes(1);
  });
  const sent = structuredClone(save.mock.calls[0]);
  controller.undo();
  gate.resolve();
  await auto;
  expect(save.mock.calls[0]).toEqual(sent);
  expect(controller.getSnapshot().units[0]?.translatedText).toBe("ab");
  expect(controller.getSnapshot().dirty).toBe(true);
  await controller.flush();
  expect(pages.get("p1")?.[0]).toMatchObject({ id: "u1", translatedText: "ab" });
  expect(save.mock.calls[1]?.[1].ops[0]?.edit).toBe("patch");
});

test("creation acknowledgement preserves a local ID even when currently undone", async () => {
  const { controller, save, backend, pages } = createUndoFixture([]);
  const gate = deferredUndoSave();
  save.mockImplementationOnce(async (...args) => {
    await gate.promise;
    return backend(...args);
  });
  controller.commit([undoUnit("local", "created")]);
  const auto = controller.saveOnce();
  await vi.waitFor(() => {
    expect(save).toHaveBeenCalledTimes(1);
  });
  controller.undo();
  gate.resolve();
  await auto;
  const permanent = pages.get("p1")?.[0]?.id;
  expect(controller.getSnapshot().units).toEqual([]);
  await controller.flush();
  expect(save.mock.calls[1]?.[1].ops).toEqual([{ edit: "delete", id: permanent }]);
  expect(pages.get("p1")).toEqual([]);
});

test("undo while refresh is pending survives the older refresh response", async () => {
  const { controller, reload, pages } = createUndoFixture();
  const gate = deferredUndoSave();
  reload.mockImplementationOnce(async () => {
    const response = structuredClone(pages.get("p1") ?? []);
    await gate.promise;
    return response;
  });
  controller.commit([undoUnit("u1", "a")]);
  const auto = controller.saveOnce();
  await vi.waitFor(() => {
    expect(reload).toHaveBeenCalledTimes(1);
  });
  controller.undo();
  gate.resolve();
  await auto;
  expect(controller.getSnapshot().units[0]?.translatedText).toBe("");
  expect(controller.getSnapshot()).toMatchObject({ dirty: true, canUndo: false });
  await controller.flush();
  expect(pages.get("p1")?.[0]?.translatedText).toBeUndefined();
});

test("a restore followed by another undo during saving sends both changes in order", async () => {
  const { controller, save, backend, pages } = createUndoFixture();
  controller.commit([undoUnit("u1", "a")]);
  controller.commit([undoUnit("u1", "ab")]);
  controller.commit([]);
  await controller.flush();
  const gate = deferredUndoSave();
  save.mockImplementationOnce(async (...args) => {
    await gate.promise;
    return backend(...args);
  });
  controller.undo();
  const auto = controller.saveOnce();
  await vi.waitFor(() => {
    expect(save).toHaveBeenCalledTimes(2);
  });
  controller.undo();
  const manual = controller.flush();
  gate.resolve();
  await Promise.all([auto, manual]);
  expect(pages.get("p1")?.[0]).toMatchObject({ id: "u1", translatedText: "a" });
  expect(controller.getSnapshot().canUndo).toBe(true);
  expect(save.mock.calls.map((call) => call[1].ops[0]?.edit)).toEqual(["delete", "patch", "patch"]);
});
