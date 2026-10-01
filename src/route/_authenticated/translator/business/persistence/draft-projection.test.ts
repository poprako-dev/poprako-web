import { expect, test, vi } from "vitest";
import type { UnitInfo } from "../unit/unit";
import type { SaveUnits } from "../contract/type";
import { createUnitSaveFixture } from "../test/unit-save-fixture";
import { createDraftDatabaseFixture } from "../test/draft-database-fixture";
import { createDraftStore, type DraftStore } from "./draft-store";
import { createUnitSaveController } from "./unit-save-controller";
import { buildUnitDiff } from "./unit-diff";
import { replayEdits } from "./draft-sequence";
function unit(id: string, index = 0): UnitInfo {
  return { id, index, xCoord: 0, yCoord: 0, isBubble: true, isFlagged: false, isProofread: false };
}
test("all same-batch creations exist before positioning, matching the server", async () => {
  const base = [unit("a"), unit("b", 1)];
  for (const ids of [
    ["b", "x", "a"],
    ["x", "y", "a", "b"],
    ["y", "b", "x", "a"],
  ]) {
    const desired = ids.map(unit);
    const diff = buildUnitDiff(desired, base);
    expect(replayEdits(base, diff, desired).map((u) => u.id)).toEqual(ids);
    const pages = new Map([["p", base]]);
    const result = await createUnitSaveFixture(pages)("p", diff, crypto.randomUUID());
    const reverse = new Map(result.createdUnitIds.map((pair) => [pair.unitId, pair.localId]));
    expect(pages.get("p")?.map((u) => reverse.get(u.id) ?? u.id)).toEqual(ids);
  }
});
test("repeated offline saves preserve order and the exact original request", async () => {
  const drafts = createDraftStore("u", "c", createDraftDatabaseFixture());
  await drafts.ready;
  const save = vi.fn<SaveUnits>().mockRejectedValue(new Error("offline"));
  const c = createUnitSaveController({
    drafts,
    save,
    reload: () => Promise.resolve([]),
    changed: vi.fn(),
    failed: vi.fn(),
  });
  c.load("p", [unit("a")]);
  c.commit([unit("x"), unit("y", 1), unit("a", 2)]);
  await expect(c.flush()).rejects.toThrow();
  const original = structuredClone(save.mock.calls[0]);
  await expect(c.flush()).rejects.toThrow();
  expect(c.getSnapshot().units.map((u) => u.id)).toEqual(["x", "y", "a"]);
  expect(save.mock.calls[1]).toEqual(original);
  expect(drafts.getState().drafts["p"]?.pending).toHaveLength(1);
});
test("refresh merges independent fields and preserves new creation order", async () => {
  const base = unit("a");
  let release: (units: UnitInfo[]) => void = () => {
    throw new Error("not started");
  };
  const reload = vi.fn(
    () =>
      new Promise<UnitInfo[]>((resolve) => {
        release = resolve;
      }),
  );
  const c = createUnitSaveController({ save: vi.fn(), reload, changed: vi.fn(), failed: vi.fn() });
  c.load("p", [base]);
  const loading = c.refresh();
  await vi.waitFor(() => {
    expect(reload).toHaveBeenCalled();
  });
  c.commit([unit("x"), unit("y", 1), { ...base, index: 2, xCoord: 0.42, isProofread: true }]);
  release([{ ...base, yCoord: 0.99, proofreadText: "remote new" }]);
  await loading;
  expect(c.getSnapshot().units.map((u) => u.id)).toEqual(["x", "y", "a"]);
  expect(c.getSnapshot().units[2]).toMatchObject({
    xCoord: 0.42,
    yCoord: 0.99,
    isProofread: true,
    proofreadText: "remote new",
  });
});
test("two tabs project local and permanent aliases into one row without changing editor identity", async () => {
  const db = createDraftDatabaseFixture();
  const a = createDraftStore("u", "c", db);
  await a.ready;
  const pages = new Map<string, UnitInfo[]>([["p", []]]);
  const backend = createUnitSaveFixture(pages);
  let offline = false;
  const save = vi.fn<SaveUnits>(async (...args) => {
    if (offline) throw new Error("offline");
    return await backend(...args);
  });
  function make(drafts: DraftStore): ReturnType<typeof createUnitSaveController> {
    return createUnitSaveController({
      drafts,
      save,
      reload: (id) => Promise.resolve(pages.get(id) ?? []),
      changed: vi.fn(),
      failed: vi.fn(),
    });
  }
  const ca = make(a);
  ca.load("p", []);
  ca.commit([unit("local")]);
  await ca.flush();
  const remote = pages.get("p")?.[0];
  if (!remote) throw new Error("missing creation");
  const b = createDraftStore("u", "c", db);
  await b.ready;
  const cb = make(b);
  cb.load("p", [remote]);
  offline = true;
  ca.commit([{ ...unit("local"), translatedText: "A" }]);
  await expect(ca.flush()).rejects.toThrow();
  cb.commit([{ ...remote, proofreadText: "B" }]);
  await expect(cb.flush()).rejects.toThrow();
  expect(cb.getSnapshot().units).toHaveLength(1);
  expect(cb.getSnapshot().units[0]).toMatchObject({
    id: remote.id,
    translatedText: "A",
    proofreadText: "B",
  });
  expect(ca.getSnapshot().units[0]?.id).toBe("local");
  const originals = save.mock.calls.slice(1).map((call) => JSON.stringify(call));
  offline = false;
  await cb.flush();
  expect(save.mock.calls.slice(3).map((call) => JSON.stringify(call))).toEqual(originals);
  expect(pages.get("p")).toHaveLength(1);
  expect(pages.get("p")?.[0]).toMatchObject({ translatedText: "A", proofreadText: "B" });
  cb.commit([]);
  await cb.flush();
  expect(pages.get("p")).toEqual([]);
});

test("new input while failure persistence waits preserves other tab's independent revision field", async () => {
  const db = createDraftDatabaseFixture();
  const a = createDraftStore("u", "c", db),
    b = createDraftStore("u", "c", db);
  await Promise.all([a.ready, b.ready]);
  const save = vi.fn<SaveUnits>().mockRejectedValue(new Error("offline"));
  function make(drafts: DraftStore): ReturnType<typeof createUnitSaveController> {
    return createUnitSaveController({
      drafts,
      save,
      reload: () => Promise.resolve([unit("u")]),
      changed: vi.fn(),
      failed: vi.fn(),
    });
  }
  const ca = make(a),
    cb = make(b);
  ca.load("p", [unit("u")]);
  cb.load("p", [unit("u")]);
  cb.commit([{ ...unit("u"), proofreadText: "other tab" }]);
  await expect(cb.flush()).rejects.toThrow();
  ca.commit([{ ...unit("u"), translatedText: "own" }]);
  const write = a.write;
  vi.spyOn(a, "write").mockImplementationOnce(async (...args) => {
    const stored = await write(...args);
    ca.commit([{ ...unit("u"), translatedText: "own", isProofread: true }]);
    return stored;
  });
  await expect(ca.flush()).rejects.toThrow();
  expect(ca.getSnapshot().units[0]).toMatchObject({
    translatedText: "own",
    proofreadText: "other tab",
    isProofread: true,
  });
});

test("reopening alias drafts replays both fields once and preserves original wire payloads", async () => {
  const db = createDraftDatabaseFixture();
  const a = createDraftStore("u", "c", db);
  await a.ready;
  const base = unit("local");
  const desired = { ...base, translatedText: "A" };
  const first = {
    version: 1 as const,
    revision: 1,
    units: [desired],
    baseline: [base],
    identities: [["local", "remote"]] as [string, string][],
    pending: [
      {
        saveId: "first",
        diff: buildUnitDiff([desired], [base]),
        wire: buildUnitDiff([{ ...desired, id: "remote" }], [{ ...base, id: "remote" }]),
        target: [desired],
      },
    ],
  };
  const remote = unit("remote"),
    other = { ...remote, proofreadText: "B" };
  await a.write("p", first);
  await a.write("p", {
    ...first,
    units: [other],
    baseline: [remote],
    identities: [["remote", "remote"]],
    pending: [
      {
        saveId: "second",
        diff: buildUnitDiff([other], [remote]),
        wire: buildUnitDiff([other], [remote]),
        target: [other],
      },
    ],
  });
  const reopened = createDraftStore("u", "c", db);
  await reopened.ready;
  const record = reopened.getState().drafts["p"];
  expect(record?.units).toHaveLength(1);
  expect(record?.units[0]).toMatchObject({ id: "remote", translatedText: "A", proofreadText: "B" });
  expect(record?.pending[0]?.wire).toEqual(first.pending[0]?.wire);
  expect(record?.pending.map((batch) => batch.saveId)).toEqual(["first", "second"]);
});
