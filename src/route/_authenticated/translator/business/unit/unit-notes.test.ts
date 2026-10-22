import { expect, test } from "vitest";
import { createUnit, unitIsTranslated, unitTypographyNote, unitTranslationNote } from "./unit";
import { applyUnitUpdates } from "./unit-edit";
import { createUnitPatch } from "./unit-patch";
import { mergeUnitVersions } from "../persistence/merge-unit-versions";

test("translation progress includes typography notes but excludes discussion and blank content", () => {
  const unit = createUnit(0, 0, true);
  expect(unitIsTranslated({ ...unit, typographyNote: " 小字\n " })).toBe(true);
  expect(unitIsTranslated({ ...unit, translationNote: "待确认" })).toBe(false);
  expect(unitIsTranslated({ ...unit, translatedText: " \t\u3000" })).toBe(false);
  expect(unitIsTranslated({ ...unit, typographyNote: " \t\u3000" })).toBe(false);
  expect(unitIsTranslated({ ...unit, translatedText: "译文" })).toBe(true);
});

test("blank note saves clear existing content and preserve spacing in nonblank notes", () => {
  const original = { ...createUnit(0, 0, true), typographyNote: "小字", translationNote: "存疑" };
  const blank = applyUnitUpdates(original, {
    typographyNote: " \t\u3000",
    translationNote: "\n\t",
  });
  expect(unitTypographyNote(blank)).toBeNull();
  expect(unitTranslationNote(blank)).toBeNull();
  expect(createUnitPatch(blank, original)).toEqual({
    id: original.id,
    typographyNote: null,
    translationNote: null,
  });
  const content = " 小字\n\n保留括号 ";
  expect(unitTypographyNote({ ...original, typographyNote: content })).toBe(content);
  expect(unitTranslationNote({ ...original, translationNote: content })).toBe(content);
});

test("notes are independently nullable and do not change translation or proofreading", () => {
  const original = createUnit(0, 0, true);
  expect(original).toMatchObject({ typographyNote: null, translationNote: null });
  const annotated = applyUnitUpdates(original, {
    typographyNote: "末尾加重",
    translationNote: "这里是反问句",
  });
  expect(unitTypographyNote(annotated)).toBe("末尾加重");
  expect(unitTranslationNote(annotated)).toBe("这里是反问句");
  expect(annotated.translatedText).toBeUndefined();
  expect(annotated.proofreadText).toBeUndefined();
  expect(annotated.isProofread).toBe(false);
  const cleared = applyUnitUpdates(annotated, { typographyNote: null });
  expect(cleared.typographyNote).toBeNull();
  expect(unitTranslationNote(cleared)).toBe("这里是反问句");
  expect(createUnitPatch(cleared, annotated)).toEqual({
    id: original.id,
    typographyNote: null,
  });
  expect(applyUnitUpdates(cleared, { translationNote: "" }).translationNote).toBeNull();
});

test("a remote translation edit preserves local notes and merges the other note field", () => {
  const original = createUnit(0, 0, true);
  const local = applyUnitUpdates(original, { translationNote: "待讨论的用词" });
  const remote = applyUnitUpdates(original, {
    translatedText: "更新后的译文",
    typographyNote: "保留断行",
  });
  expect(mergeUnitVersions([original], [local], [remote])[0]).toMatchObject({
    translatedText: "更新后的译文",
    typographyNote: "保留断行",
    translationNote: "待讨论的用词",
  });
});
