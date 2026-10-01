import { expect, test, vi } from "vitest";
import type { UnitInfo } from "../unit/unit";
import { createDraftDatabaseFixture } from "../test/draft-database-fixture";
import { createUnitSaveFixture } from "../test/unit-save-fixture";
import { createDraftStore, type DraftStore } from "./draft-store";
import {
  createUnitSaveController,
  LocalDraftSavedError,
  type UnitSaveController,
} from "./unit-save-controller";
import type { SaveUnits } from "../contract/type";

function unit(id = "existing", text = "before"): UnitInfo {
  return {
    id,
    index: 0,
    xCoord: 0,
    yCoord: 0,
    isBubble: true,
    isFlagged: false,
    isProofread: false,
    translatedText: text,
  };
}
function controller(
  drafts: DraftStore,
  save: SaveUnits,
  pages: Map<string, UnitInfo[]>,
): UnitSaveController {
  return createUnitSaveController({
    drafts,
    save,
    reload: (id) => Promise.resolve(pages.get(id) ?? []),
    changed: vi.fn(),
    failed: vi.fn(),
  });
}

test("failure alone persists; a lost creation response reopens and retries its exact batch", async () => {
  const db = createDraftDatabaseFixture();
  const store = createDraftStore("user", "chapter", db);
  await store.ready;
  const pages = new Map<string, UnitInfo[]>([["p", []]]);
  const backend = createUnitSaveFixture(pages);
  const save = vi.fn(backend).mockImplementationOnce(async (...args) => {
    await backend(...args);
    throw new Error("lost response");
  });
  const first = controller(store, save, pages);
  first.load("p", []);
  first.commit([unit("local", "created")]);
  const clean = createDraftStore("user", "chapter", db);
  await clean.ready;
  expect(clean.getState().drafts).toEqual({});
  await expect(first.saveOnce()).rejects.toBeInstanceOf(LocalDraftSavedError);
  const frozen = structuredClone(save.mock.calls[0]);
  first.commit([unit("local", "new input")]);
  const reopened = createDraftStore("user", "chapter", db);
  await reopened.ready;
  const next = controller(reopened, save, pages);
  next.load("p", pages.get("p") ?? []);
  expect(next.getSnapshot().units).toHaveLength(1);
  expect(next.getSnapshot().units[0]?.id).toBe("local");
  expect(next.getSnapshot().units[0]?.translatedText).toBe("created");
  next.commit([unit("local", "edited after reopening")]);
  await next.flush();
  expect(save.mock.calls[1]).toEqual(frozen);
  expect(save.mock.calls[2]?.[2]).not.toBe(frozen?.[2]);
  expect(save.mock.calls[2]?.[1].ops[0]).toMatchObject({
    edit: "patch",
    id: pages.get("p")?.[0]?.id,
  });
  expect(pages.get("p")).toHaveLength(1);
  expect(pages.get("p")?.[0]?.translatedText).toBe("edited after reopening");
  const cleared = createDraftStore("user", "chapter", db);
  await cleared.ready;
  expect(cleared.getState().drafts).toEqual({});
});

test("two failed tabs concatenate immutable batches and replay every batch without cross-batch compaction", async () => {
  const db = createDraftDatabaseFixture();
  const a = createDraftStore("user", "chapter", db);
  const b = createDraftStore("user", "chapter", db);
  await Promise.all([a.ready, b.ready]);
  const pages = new Map<string, UnitInfo[]>([["p", [unit()]]]);
  const offline = vi.fn<SaveUnits>().mockRejectedValue(new Error("offline"));
  const ca = controller(a, offline, pages),
    cb = controller(b, offline, pages);
  ca.load("p", [unit()]);
  cb.load("p", [unit()]);
  ca.commit([unit("existing", "A"), { ...unit("new-a", "new"), index: 1 }]);
  await expect(ca.saveOnce()).rejects.toBeInstanceOf(LocalDraftSavedError);
  const firstBatch = structuredClone(a.getState().drafts["p"]?.pending[0]);
  cb.commit([{ ...unit(), proofreadText: "B", isProofread: true }]);
  await expect(cb.saveOnce()).rejects.toBeInstanceOf(LocalDraftSavedError);
  expect(cb.getSnapshot().units).toHaveLength(2);
  expect(cb.getSnapshot().units[0]).toMatchObject({ translatedText: "A", proofreadText: "B" });
  expect(b.getState().drafts["p"]?.pending).toHaveLength(2);
  expect(JSON.stringify(b.getState().drafts["p"]?.pending[0]?.wire)).toBe(
    JSON.stringify(firstBatch?.wire),
  );
  expect(b.getState().drafts["p"]?.pending[0]?.saveId).toBe(firstBatch?.saveId);
  const ids = b.getState().drafts["p"]?.pending.map((batch) => batch.saveId);
  await expect(cb.saveOnce()).rejects.toBeInstanceOf(LocalDraftSavedError);
  expect(b.getState().drafts["p"]?.pending.map((batch) => batch.saveId)).toEqual(ids);
  const otherUser = createDraftStore("other-user", "chapter", db);
  const otherChapter = createDraftStore("user", "other-chapter", db);
  await Promise.all([otherUser.ready, otherChapter.ready]);
  expect(otherUser.getState().drafts).toEqual({});
  expect(otherChapter.getState().drafts).toEqual({});
});

test("acknowledging one tab's creation preserves another tab's later batch and its ID mapping", async () => {
  const db = createDraftDatabaseFixture();
  const a = createDraftStore("user", "chapter", db);
  await a.ready;
  const pages = new Map<string, UnitInfo[]>([["p", []]]);
  const backend = createUnitSaveFixture(pages);
  const saveA = vi.fn(backend).mockRejectedValueOnce(new Error("offline"));
  const ca = controller(a, saveA, pages);
  ca.load("p", []);
  ca.commit([unit("local", "A")]);
  await expect(ca.saveOnce()).rejects.toBeInstanceOf(LocalDraftSavedError);
  const b = createDraftStore("user", "chapter", db);
  await b.ready;
  const cb = controller(b, vi.fn<SaveUnits>().mockRejectedValue(new Error("offline")), pages);
  cb.load("p", []);
  cb.commit([unit("local", "B")]);
  await expect(cb.saveOnce()).rejects.toBeInstanceOf(LocalDraftSavedError);
  await ca.flush();
  const remaining = createDraftStore("user", "chapter", db);
  await remaining.ready;
  expect(remaining.getState().drafts["p"]?.pending).toHaveLength(1);
  expect(remaining.getState().drafts["p"]?.units[0]?.translatedText).toBe("B");
  const finish = controller(remaining, backend, pages);
  finish.load("p", pages.get("p") ?? []);
  await finish.flush();
  expect(pages.get("p")).toHaveLength(1);
  expect(pages.get("p")?.[0]?.translatedText).toBe("B");
});

test("new input during persistence remains visible and is included before leaving", async () => {
  const db = createDraftDatabaseFixture();
  const store = createDraftStore("user", "chapter", db);
  await store.ready;
  const original = store.write;
  const pages = new Map([["p", [unit()]]]);
  const c = controller(store, vi.fn<SaveUnits>().mockRejectedValue(new Error("offline")), pages);
  c.load("p", [unit()]);
  c.commit([unit("existing", "first")]);
  vi.spyOn(store, "write").mockImplementationOnce(async (...args) => {
    const result = await original(...args);
    c.commit([unit("existing", "new typing")]);
    return result;
  });
  await expect(c.flush()).rejects.toBeInstanceOf(LocalDraftSavedError);
  expect(c.getSnapshot().units[0]?.translatedText).toBe("new typing");
  const restored = createDraftStore("user", "chapter", db);
  await restored.ready;
  expect(restored.getState().drafts["p"]?.units[0]?.translatedText).toBe("new typing");
  expect(restored.getState().drafts["p"]?.pending).toHaveLength(2);
});

test("a late failure persists the original page after editor unmount without changing another page", async () => {
  const db = createDraftDatabaseFixture();
  const drafts = createDraftStore("user", "chapter", db);
  await drafts.ready;
  let rejectSave: (error: Error) => void = () => {
    throw new Error("not dispatched");
  };
  const save = vi.fn<SaveUnits>(
    () =>
      new Promise((_resolve, reject) => {
        rejectSave = reject;
      }),
  );
  const c = controller(drafts, save, new Map([["p", [unit()]]]));
  c.load("p", [unit()]);
  c.commit([unit("existing", "retain")]);
  const pending = c.saveOnce();
  await Promise.resolve();
  c.commit([unit("existing", "latest before unmount")]);
  c.setActive(false);
  c.load("another", [unit("other", "other page")]);
  rejectSave(new Error("session expired"));
  await pending;
  const reopened = createDraftStore("user", "chapter", db);
  await reopened.ready;
  expect(reopened.getState().drafts["p"]?.units[0]?.translatedText).toBe("latest before unmount");
  expect(reopened.getState().drafts["p"]?.pending).toHaveLength(2);
  expect(c.getSnapshot().units[0]?.translatedText).toBe("other page");
});

test("a patch following another tab's deletion retains its local projection for tombstone restoration", async () => {
  const db = createDraftDatabaseFixture();
  const a = createDraftStore("user", "chapter", db),
    b = createDraftStore("user", "chapter", db);
  await Promise.all([a.ready, b.ready]);
  const pages = new Map([["p", [unit()]]]);
  const offline = vi.fn<SaveUnits>().mockRejectedValue(new Error("offline"));
  const ca = controller(a, offline, pages),
    cb = controller(b, offline, pages);
  ca.load("p", [unit()]);
  cb.load("p", [unit()]);
  ca.commit([]);
  await expect(ca.flush()).rejects.toBeInstanceOf(LocalDraftSavedError);
  cb.commit([unit("existing", "keep edit")]);
  await expect(cb.flush()).rejects.toBeInstanceOf(LocalDraftSavedError);
  expect(cb.getSnapshot().units[0]?.translatedText).toBe("keep edit");
  expect(b.getState().drafts["p"]?.pending.map((batch) => batch.diff.ops[0]?.edit)).toEqual([
    "delete",
    "patch",
  ]);
});
