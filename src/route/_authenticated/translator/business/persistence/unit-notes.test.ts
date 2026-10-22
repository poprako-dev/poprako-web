import { expect, test } from "vitest";
import { createUnit } from "../unit/unit";
import { applyUnitUpdates } from "../unit/unit-edit";
import { buildUnitDiff } from "./unit-diff";
import { replayEdits } from "./draft-sequence";
import { parseDraft, type DraftRecord } from "./draft-record";
import { createUnitSaveController } from "./unit-save-controller";
import { createUnitSaveFixture } from "../test/unit-save-fixture";

function draft(units: DraftRecord["units"]): DraftRecord {
  return { version: 1, revision: 1, units, baseline: units, pending: [], identities: [] };
}

test("note-only edits produce independent assign and clear patches and replay across remote edits", () => {
  const original = createUnit(0, 0, true);
  const edited = applyUnitUpdates(original, {
    translationNote: "这里是反问句",
    typographyNote: "末尾加重",
  });
  const diff = buildUnitDiff([edited], [original]);
  expect(diff.ops).toEqual([
    {
      edit: "patch",
      id: original.id,
      nextId: { type: "skip" },
      translation: { type: "skip" },
      revision: { type: "skip" },
      translationNote: { type: "assign", value: "这里是反问句" },
      typographyNote: { type: "assign", value: "末尾加重" },
    },
  ]);
  const replayed = replayEdits([{ ...original, translatedText: "remote" }], diff);
  expect(replayed[0]).toMatchObject({ ...edited, translatedText: "remote" });
  const cleared = applyUnitUpdates(edited, { typographyNote: null });
  const clearDiff = buildUnitDiff([cleared], [edited]);
  expect(clearDiff.ops[0]).toMatchObject({ typographyNote: { type: "clear" } });
  expect(replayEdits([edited], clearDiff)[0]).toEqual(cleared);
  expect(buildUnitDiff([cleared], [cleared]).ops).toEqual([]);
});

test("new units retain both notes when replayed and when permanent IDs are acknowledged", async () => {
  const unit = { ...createUnit(0, 0, true), translationNote: "翻校", typographyNote: "嵌字" };
  const diff = buildUnitDiff([unit], []);
  expect(diff.ops[0]).toMatchObject({ translationNote: "翻校", typographyNote: "嵌字" });
  expect(replayEdits([], diff)[0]).toMatchObject(unit);
  const pages = new Map<string, (typeof unit)[]>([["page", []]]);
  const controller = createUnitSaveController({
    save: createUnitSaveFixture(pages),
    reload: (id) => Promise.resolve(pages.get(id) ?? []),
    changed: () => undefined,
    failed: () => undefined,
  });
  controller.load("page", []);
  controller.commit([unit]);
  await controller.flush();
  const saved = controller.getSnapshot().units[0];
  expect(saved).toMatchObject({ translationNote: "翻校", typographyNote: "嵌字" });
  expect(pages.get("page")?.[0]?.id).not.toBe(unit.id);
  expect(pages.get("page")?.[0]).toMatchObject({ translationNote: "翻校", typographyNote: "嵌字" });
  if (!saved) throw new Error("Missing saved unit");
  controller.commit([{ ...saved, typographyNote: null }]);
  await controller.flush();
  expect(pages.get("page")?.[0]).toMatchObject({ translationNote: "翻校", typographyNote: null });
  expect(controller.getSnapshot().dirty).toBe(false);
  controller.undo();
  await controller.flush();
  expect(pages.get("page")?.[0]).toMatchObject({ translationNote: "翻校", typographyNote: "嵌字" });
});

test("draft recovery retains note patches and rejects malformed note assignments", () => {
  const original = createUnit(0, 0, true);
  const edited = { ...original, translationNote: "翻校", typographyNote: "嵌字" };
  const record = draft([original]);
  record.pending = [
    { saveId: "save", diff: buildUnitDiff([edited], [original]), target: [edited] },
  ];
  expect(parseDraft(JSON.stringify(record))).toEqual(record);
  const malformed = JSON.stringify(record).replace('"value":"翻校"', '"value":123');
  expect(() => parseDraft(malformed)).toThrow("草稿损坏");
});

test("legacy drafts rename notes by audience throughout baselines and pending targets", () => {
  const unit = createUnit(0, 0, true);
  const { translationNote: _translation, typographyNote: _typography, ...fields } = unit;
  const legacy = { ...fields, translationComment: "嵌字", supplementComment: "翻校" };
  const record = draft([unit]);
  record.pending = [{ saveId: "save", diff: { ops: [] }, target: [unit] }];
  const raw = JSON.stringify(record).replaceAll(JSON.stringify(unit), JSON.stringify(legacy));
  const restored = parseDraft(raw);
  for (const notes of [restored.units[0], restored.baseline[0], restored.pending[0]?.target[0]]) {
    expect(notes).toMatchObject({ typographyNote: "嵌字", translationNote: "翻校" });
    expect(notes).not.toHaveProperty("translationComment");
    expect(notes).not.toHaveProperty("supplementComment");
  }
});
