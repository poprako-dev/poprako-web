import { expect, test, vi } from "vitest";
import { createDraftDatabaseFixture } from "../test/draft-database-fixture";
import { createDraftStore } from "./draft-store";
import { limitDraftRows, type DraftRow } from "./draft-database";
import { createUnitSaveController, LocalDraftSavedError } from "./unit-save-controller";
import { syncChapterDrafts } from "./chapter-draft-sync";
import type { UnitInfo } from "../unit/unit";
import type { SaveUnits } from "../contract/type";
const unit: UnitInfo = {
  id: "u",
  index: 0,
  xCoord: 0,
  yCoord: 0,
  isBubble: true,
  isFlagged: false,
  isProofread: false,
};

function row(key: string, bytes: number, touched: number): DraftRow {
  return { key, scope: "scope", pageId: key, raw: "x".repeat(bytes), touched };
}
test("the 4 MiB budget evicts whole oldest pages and rejects an oversized current page", () => {
  const mib = 1024 * 1024;
  expect(
    limitDraftRows(
      [row("old", 2 * mib, 1), row("recent", mib, 2), row("current", 2 * mib, 3)],
      "current",
    ).map((r) => r.key),
  ).toEqual(["recent", "current"]);
  expect(() => limitDraftRows([row("current", 5 * mib, 1)], "current")).toThrow("容量");
});
test("corrupt records are retained while the current buffer survives failed persistence", async () => {
  const db = createDraftDatabaseFixture();
  const raw = "not json";
  await db.transact(() => ({
    rows: [
      {
        key: JSON.stringify(["u", "c", "p"]),
        scope: JSON.stringify(["u", "c"]),
        pageId: "p",
        raw,
        touched: 0,
      },
    ],
    result: undefined,
  }));
  const drafts = createDraftStore("u", "c", db);
  await drafts.ready;
  expect(drafts.getState().recoveryErrors["p"]).toBeTruthy();
  const c = createUnitSaveController({
    drafts,
    save: vi.fn().mockRejectedValue(new Error("offline")),
    reload: () => Promise.resolve([unit]),
    changed: vi.fn(),
    failed: vi.fn(),
  });
  c.load("p", [unit]);
  c.commit([{ ...unit, proofreadText: "保留" }]);
  await expect(c.flush()).rejects.toThrow();
  expect(c.getSnapshot().units[0]?.proofreadText).toBe("保留");
  expect(await db.transact((rows) => ({ rows, result: rows[0]?.raw }))).toBe(raw);
});
test("chapter operations synchronize non-current drafts and stop on failed remote persistence", async () => {
  const db = createDraftDatabaseFixture();
  const drafts = createDraftStore("u", "c", db);
  await drafts.ready;
  const save = vi.fn<SaveUnits>().mockRejectedValue(new Error("offline"));
  const failed = vi.fn();
  const reload = vi.fn(() => Promise.resolve([unit]));
  const current = createUnitSaveController({ drafts, save, reload, failed, changed: vi.fn() });
  current.load("first", [unit]);
  current.commit([{ ...unit, translatedText: "first edited" }]);
  await expect(current.flush()).rejects.toBeInstanceOf(LocalDraftSavedError);
  current.load("second", [unit]);
  await expect(
    syncChapterDrafts({ current, drafts, save, reload, failed, canWrite: () => true }),
  ).rejects.toBeInstanceOf(LocalDraftSavedError);
  expect(save.mock.calls.map((call) => call[0])).toEqual(["first", "first"]);
  expect(drafts.getState().drafts["first"]?.units[0]?.translatedText).toBe("first edited");
  expect(reload).not.toHaveBeenCalled();
});

test("lost editing permission still allows local fallback without uploading the restored draft", async () => {
  const drafts = createDraftStore("u", "c", createDraftDatabaseFixture());
  await drafts.ready;
  let writable = true;
  const save = vi.fn();
  const current = createUnitSaveController({
    drafts,
    save,
    canWrite: () => writable,
    reload: () => Promise.resolve([unit]),
    changed: vi.fn(),
    failed: vi.fn(),
  });
  current.load("p", [unit]);
  current.commit([{ ...unit, translatedText: "保留" }]);
  writable = false;
  await expect(current.flush()).rejects.toBeInstanceOf(LocalDraftSavedError);
  expect(save).not.toHaveBeenCalled();
  expect(drafts.getState().drafts["p"]?.units[0]?.translatedText).toBe("保留");
});
