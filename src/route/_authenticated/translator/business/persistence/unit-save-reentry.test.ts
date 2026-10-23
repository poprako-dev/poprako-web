import { expect, test, vi, type Mock } from "vitest";
import type { SaveUnits } from "../contract/type";
import type { UnitInfo } from "../unit/unit";
import { undoUnit } from "../test/unit-undo-fixture";
import { createDraftDatabaseFixture } from "../test/draft-database-fixture";
import { createUnitSaveFixture } from "../test/unit-save-fixture";
import { type DraftStore, createDraftStore } from "./draft-store";
import { type UnitSaveController, createUnitSaveController } from "./unit-save-controller";

async function setup(initial: UnitInfo[] = []): Promise<{
  drafts: DraftStore;
  pages: Map<string, UnitInfo[]>;
  controller: UnitSaveController;
  save: Mock<SaveUnits>;
  changed: Mock;
}> {
  const drafts = createDraftStore("u", "c", createDraftDatabaseFixture());
  await drafts.ready;
  const pages = new Map([["p", initial]]);
  const save = vi.fn(createUnitSaveFixture(pages));
  const changed = vi.fn();
  const controller = createUnitSaveController({
    drafts,
    save,
    reload: (id) => Promise.resolve(pages.get(id) ?? []),
    changed,
    failed: vi.fn(),
  });
  controller.load("p", initial);
  return { drafts, pages, controller, save, changed };
}

test("save requests reentered through draft subscribers and changed callbacks join the running promise", async () => {
  const { drafts, controller, save, changed } = await setup();
  controller.commit([undoUnit("local")]);
  const joined: Promise<void>[] = [];
  const unsubscribe = drafts.subscribe(() => {
    if (controller.getSnapshot().saving) joined.push(controller.saveOnce());
  });
  changed.mockImplementation(() => {
    if (controller.getSnapshot().saving) joined.push(controller.saveOnce());
  });
  const saving = controller.saveOnce();
  await saving;
  unsubscribe();
  expect(joined.length).toBeGreaterThan(1);
  expect(joined.every((promise) => promise === saving)).toBe(true);
  expect(save).toHaveBeenCalledTimes(1);
});

test("switching pages in the wire publication prevents sending the stale page with new page state", async () => {
  const { drafts, controller, save } = await setup();
  controller.commit([undoUnit("local", "first")]);
  let switched = false;
  const unsubscribe = drafts.subscribe((state) => {
    if (switched || !state.drafts["p"]?.pending[0]?.wire) return;
    switched = true;
    controller.load("other", [undoUnit("other")]);
  });
  await controller.saveOnce();
  unsubscribe();
  expect(switched).toBe(true);
  expect(save).not.toHaveBeenCalled();
  expect(controller.getPageId()).toBe("other");
  expect(controller.getSnapshot().units[0]?.id).toBe("other");
  expect(drafts.getState().drafts["p"]?.pending[0]?.wire).toBeDefined();
  controller.load("p", []);
  await controller.flush();
  expect(save).toHaveBeenCalledTimes(1);
  expect(controller.getSnapshot().units[0]?.translatedText).toBe("first");
});

test("acknowledgement retains the saved page's aliases when a subscriber switches pages", async () => {
  const { drafts, controller, pages } = await setup();
  const acknowledge = vi.spyOn(drafts, "acknowledge");
  controller.commit([undoUnit("local")]);
  let switched = false;
  const unsubscribe = drafts.subscribe((state) => {
    if (switched || state.drafts["p"]) return;
    switched = true;
    controller.load("other", [undoUnit("other")]);
  });
  await controller.saveOnce();
  unsubscribe();
  const permanent = pages.get("p")?.[0]?.id;
  expect(switched).toBe(true);
  expect(acknowledge.mock.calls[0]?.[0]).toBe("p");
  expect(acknowledge.mock.calls[0]?.[2]).toEqual([["local", permanent]]);
  expect(controller.getPageId()).toBe("other");
  expect(controller.getSnapshot().units[0]?.id).toBe("other");
});
