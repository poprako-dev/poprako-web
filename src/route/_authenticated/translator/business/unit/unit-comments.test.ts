import { expect, test } from "vitest";
import { createUnit, unitTranslationComment, unitSupplementComment } from "./unit";
import { applyUnitUpdates } from "./unit-edit";
import { createUnitPatch } from "./unit-patch";
import { mergeUnitVersions } from "../persistence/merge-unit-versions";

test("comments are independently nullable and do not change translation or proofreading", () => {
  const original = createUnit(0, 0, true);
  expect(original).toMatchObject({ translationComment: null, supplementComment: null });
  const commented = applyUnitUpdates(original, {
    translationComment: "末尾加重",
    supplementComment: "这里是反问句",
  });
  expect(unitTranslationComment(commented)).toBe("末尾加重");
  expect(unitSupplementComment(commented)).toBe("这里是反问句");
  expect(commented.translatedText).toBeUndefined();
  expect(commented.proofreadText).toBeUndefined();
  expect(commented.isProofread).toBe(false);
  const cleared = applyUnitUpdates(commented, { translationComment: null });
  expect(cleared.translationComment).toBeNull();
  expect(unitSupplementComment(cleared)).toBe("这里是反问句");
  expect(createUnitPatch(cleared, commented)).toEqual({
    id: original.id,
    translationComment: null,
  });
  expect(applyUnitUpdates(cleared, { supplementComment: "" }).supplementComment).toBeNull();
});

test("a remote translation edit preserves local comments and merges the other comment field", () => {
  const original = createUnit(0, 0, true);
  const local = applyUnitUpdates(original, { supplementComment: "待讨论的用词" });
  const remote = applyUnitUpdates(original, {
    translatedText: "更新后的译文",
    translationComment: "保留断行",
  });
  expect(mergeUnitVersions([original], [local], [remote])[0]).toMatchObject({
    translatedText: "更新后的译文",
    translationComment: "保留断行",
    supplementComment: "待讨论的用词",
  });
});
