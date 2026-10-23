import { expect, test, vi, type Mock } from "vitest";
import type { UnitInfo } from "../unit/unit";
import type { SaveUnits } from "../contract/type";
import { createDraftDatabaseFixture } from "../test/draft-database-fixture";
import { createUnitSaveFixture } from "../test/unit-save-fixture";
import { deferredUndoSave, undoUnit } from "../test/unit-undo-fixture";
import { type DraftStore, createDraftStore } from "./draft-store";
import { type UnitSaveController, createUnitSaveController } from "./unit-save-controller";

function freeze(value: unknown): void {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return;
  for (const child of Object.values(value)) freeze(child);
  Object.freeze(value);
}

async function setup(initial: UnitInfo[] = []): Promise<{
  drafts: DraftStore;
  pages: Map<string, UnitInfo[]>;
  controller: UnitSaveController;
  save: Mock<SaveUnits>;
}> {
  const drafts = createDraftStore("u", "c", createDraftDatabaseFixture());
  await drafts.ready;
  const pages = new Map([["p", initial]]);
  const save = vi.fn(createUnitSaveFixture(pages));
  const controller = createUnitSaveController({
    drafts,
    save,
    reload: (id) => Promise.resolve(pages.get(id) ?? []),
    changed: vi.fn(),
    failed: vi.fn(),
  });
  controller.load("p", initial);
  return { drafts, pages, controller, save };
}

test("unsealed and in-flight draft snapshots survive edits, failure, retry and acknowledgement unchanged", async () => {
  const { drafts, pages, controller, save } = await setup();
  const backend = save.getMockImplementation();
  if (!backend) throw new Error("missing backend");
  const gate = deferredUndoSave();
  save.mockImplementationOnce(async (...args) => {
    await backend(...args);
    await gate.promise;
    throw new Error("lost response");
  });
  controller.commit([undoUnit("local", "first")]);
  const unsealed = drafts.getState().drafts["p"];
  const snapshot = controller.getSnapshot();
  const original = JSON.stringify(unsealed);
  freeze(unsealed);
  freeze(snapshot);
  const first = controller.saveOnce();
  await vi.waitFor(() => {
    expect(save).toHaveBeenCalledTimes(1);
  });
  const inFlight = drafts.getState().drafts["p"];
  const sent = JSON.stringify(inFlight);
  freeze(inFlight);
  controller.commit([undoUnit("local", "second")]);
  gate.resolve();
  await expect(first).rejects.toThrow("已暂存为本地草稿");
  await controller.flush();
  expect(JSON.stringify(unsealed)).toBe(original);
  expect(JSON.stringify(inFlight)).toBe(sent);
  expect(snapshot.units[0]?.translatedText).toBe("first");
  expect(save.mock.calls[1]).toEqual(save.mock.calls[0]);
  expect(pages.get("p")).toHaveLength(1);
  expect(pages.get("p")?.[0]?.translatedText).toBe("second");
  expect(drafts.getState().drafts["p"]).toBeUndefined();
});

test("load and commit isolate caller-owned scalar objects while retaining unchanged owned units", async () => {
  const initial = [undoUnit("a", "base"), { ...undoUnit("b"), index: 1 }];
  const { drafts, controller } = await setup(initial);
  const before = controller.getSnapshot().units;
  const first = initial[0];
  if (!first) throw new Error("missing unit");
  first.translatedText = "external mutation";
  expect(before[0]?.translatedText).toBe("base");
  const changed = { ...before[0], ...undoUnit("a", "committed") };
  const next = [changed, before[1] ?? undoUnit("b")];
  controller.commit(next);
  const record = drafts.getState().drafts["p"];
  changed.translatedText = "later mutation";
  next.reverse();
  expect(record?.units[0]?.translatedText).toBe("committed");
  expect(record?.units[1]).toBe(before[1]);
  expect(controller.getSnapshot().units).toBe(record?.units);
});

test("detached failure seals a copy and preserves both the old sent record and the leaving-page buffer", async () => {
  const { drafts, controller, save } = await setup();
  const gate = deferredUndoSave();
  save.mockImplementationOnce(async () => {
    await gate.promise;
    throw new Error("offline");
  });
  controller.commit([undoUnit("local", "sent")]);
  const saving = controller.saveOnce();
  await vi.waitFor(() => {
    expect(save).toHaveBeenCalledTimes(1);
  });
  const sent = drafts.getState().drafts["p"];
  const originalSent = JSON.stringify(sent);
  freeze(sent);
  controller.commit([undoUnit("local", "leaving")]);
  const leaving = drafts.getState().drafts["p"];
  const originalLeaving = JSON.stringify(leaving);
  freeze(leaving);
  controller.load("other", [undoUnit("other")]);
  gate.resolve();
  await saving;
  expect(JSON.stringify(sent)).toBe(originalSent);
  expect(JSON.stringify(leaving)).toBe(originalLeaving);
  expect(drafts.getState().drafts["p"]?.pending).toHaveLength(2);
  expect(drafts.getState().drafts["p"]?.units[0]?.translatedText).toBe("leaving");
  controller.load("p", []);
  await controller.flush();
  expect(save.mock.calls[1]).toEqual(save.mock.calls[0]);
  expect(controller.getSnapshot().units[0]?.translatedText).toBe("leaving");
});

test("external draft updates keep their defensive ownership boundary", async () => {
  const { drafts, controller } = await setup();
  controller.commit([undoUnit("local", "value")]);
  const own = structuredClone(drafts.getState().drafts["p"]);
  if (!own) throw new Error("missing draft");
  drafts.update("external", own);
  own.pending = [];
  const unit = own.units[0];
  if (!unit) throw new Error("missing unit");
  unit.translatedText = "external mutation";
  expect(drafts.getState().drafts["external"]?.units[0]?.translatedText).toBe("value");
});
