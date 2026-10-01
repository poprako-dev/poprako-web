import { expect, test, vi } from "vitest";
import type { SaveUnits } from "../contract/type";
import type { UnitInfo } from "../unit/unit";
import { createDraftDatabaseFixture } from "../test/draft-database-fixture";
import { createDraftStore } from "./draft-store";
import { createUnitSaveController } from "./unit-save-controller";
const unit: UnitInfo = {
  id: "u",
  index: 0,
  xCoord: 0,
  yCoord: 0,
  isBubble: true,
  isFlagged: false,
  isProofread: false,
};

async function setup(): Promise<{
  db: ReturnType<typeof createDraftDatabaseFixture>;
  drafts: ReturnType<typeof createDraftStore>;
  save: ReturnType<typeof vi.fn<SaveUnits>>;
  c: ReturnType<typeof createUnitSaveController>;
}> {
  const db = createDraftDatabaseFixture();
  const original = createDraftStore("u", "c", db);
  await original.ready;
  const save = vi.fn<SaveUnits>().mockRejectedValue(new Error("offline"));
  const source = createUnitSaveController({
    drafts: original,
    save,
    reload: () => Promise.resolve([unit]),
    changed: vi.fn(),
    failed: vi.fn(),
  });
  source.load("p", [unit]);
  source.commit([{ ...unit, proofreadText: "draft text", yCoord: 0.8 }]);
  await expect(source.flush()).rejects.toThrow();
  vi.spyOn(db, "transact").mockRejectedValueOnce(new Error("read unavailable"));
  const drafts = createDraftStore("u", "c", db);
  await drafts.ready;
  const c = createUnitSaveController({
    drafts,
    save,
    reload: () => Promise.resolve([unit]),
    changed: vi.fn(),
    failed: vi.fn(),
  });
  c.load("p", [unit]);
  return { db, drafts, save, c };
}
test("retry restores drafts while preserving fields edited before and during the read", async () => {
  const { db, drafts, save, c } = await setup();
  expect(drafts.getState().recoveryErrors["*"]).toBe("read unavailable");
  c.commit([{ ...unit, isProofread: true }]);
  const transact = db.transact;
  vi.spyOn(db, "transact").mockImplementationOnce(async (change) => {
    c.commit([{ ...unit, isProofread: true, xCoord: 0.4 }]);
    return await transact(change);
  });
  const calls = save.mock.calls.length;
  await c.retryRecovery();
  expect(save).toHaveBeenCalledTimes(calls);
  expect(c.getSnapshot().units[0]).toMatchObject({
    proofreadText: "draft text",
    isProofread: true,
    xCoord: 0.4,
    yCoord: 0.8,
  });
  expect(drafts.getState().recoveryErrors).toEqual({});
  expect(drafts.getState().drafts["p"]?.pending).toHaveLength(1);
});
test("late recovery never replaces a newly loaded page", async () => {
  const { db, c } = await setup();
  const transact = db.transact;
  vi.spyOn(db, "transact").mockImplementationOnce(async (change) => {
    c.load("other", [{ ...unit, id: "other", translatedText: "new page" }]);
    return await transact(change);
  });
  await c.retryRecovery();
  expect(c.getSnapshot().units[0]).toMatchObject({ id: "other", translatedText: "new page" });
});
