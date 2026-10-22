import { expect, test, vi } from "vitest";
import { createUndoFixture, deferredUndoSave, undoUnit } from "../test/unit-undo-fixture";

test("dirty refresh performs one write and consumes its single authoritative read", async () => {
  const { controller, save, reload } = createUndoFixture();
  controller.commit([undoUnit("u1", "edited")]);
  await controller.refresh();
  expect(save).toHaveBeenCalledTimes(1);
  expect(reload.mock.calls).toEqual([["p1"]]);
  expect(controller.getSnapshot()).toMatchObject({ dirty: false, refreshError: false });
  expect(controller.getSnapshot().units[0]?.translatedText).toBe("edited");
});

test("clean explicit refresh always reads collaborative changes", async () => {
  const { controller, save, reload, pages } = createUndoFixture();
  pages.set("p1", [undoUnit("u1", "collaborator")]);
  await controller.refresh();
  pages.set("p1", [undoUnit("u1", "later")]);
  await controller.refresh();
  expect(save).not.toHaveBeenCalled();
  expect(reload).toHaveBeenCalledTimes(2);
  expect(controller.getSnapshot().units[0]?.translatedText).toBe("later");
});

test("refresh joins autosave, preserves concurrent edits and avoids an extra final GET", async () => {
  const { controller, save, reload, backend, pages } = createUndoFixture();
  const gate = deferredUndoSave();
  save.mockImplementationOnce(async (...args) => {
    await gate.promise;
    return backend(...args);
  });
  controller.commit([undoUnit("u1", "first")]);
  const saving = controller.saveOnce();
  const refreshing = controller.refresh();
  controller.commit([undoUnit("u1", "second")]);
  gate.resolve();
  await Promise.all([saving, refreshing]);
  expect(save).toHaveBeenCalledTimes(2);
  expect(reload).toHaveBeenCalledTimes(2);
  expect(pages.get("p1")?.[0]?.translatedText).toBe("second");
  expect(controller.getSnapshot().dirty).toBe(false);
});

test("failed save refresh retries only the authority read and keeps acknowledged save IDs", async () => {
  const { controller, save, reload } = createUndoFixture();
  reload.mockRejectedValueOnce(new Error("offline"));
  controller.commit([undoUnit("u1", "saved")]);
  await expect(controller.refresh()).rejects.toThrow("页面刷新失败");
  expect(save).toHaveBeenCalledTimes(1);
  expect(reload).toHaveBeenCalledTimes(1);
  await controller.refresh();
  expect(save).toHaveBeenCalledTimes(1);
  expect(reload).toHaveBeenCalledTimes(2);
  expect(controller.getSnapshot()).toMatchObject({ dirty: false, refreshError: false });
});

test("late refresh cannot issue a second read against a newly selected page", async () => {
  const { controller, reload } = createUndoFixture();
  const gate = deferredUndoSave();
  reload.mockImplementationOnce(async () => {
    await gate.promise;
    return [undoUnit("u1", "old page")];
  });
  controller.commit([undoUnit("u1", "edited")]);
  const refreshing = controller.refresh();
  await vi.waitFor(() => {
    expect(reload).toHaveBeenCalledTimes(1);
  });
  controller.load("p2", [undoUnit("other", "current")]);
  gate.resolve();
  await refreshing;
  expect(reload.mock.calls).toEqual([["p1"]]);
  expect(controller.getSnapshot().units[0]?.translatedText).toBe("current");
});
