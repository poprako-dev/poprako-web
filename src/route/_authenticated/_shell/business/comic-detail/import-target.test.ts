import { expect, test } from "vitest";
import {
  defaultImportTarget,
  importDialogTitle,
  resolveImportTargets,
} from "@/route/_authenticated/_shell/business/comic-detail/import-target";

test("resolves a fixed target for a single role", () => {
  expect(resolveImportTargets({ canTranslate: true, canProofread: false, format: "lp" })).toEqual([
    { value: "translation", label: "翻译" },
  ]);
  expect(resolveImportTargets({ canTranslate: false, canProofread: true, format: "json" })).toEqual(
    [{ value: "proofread", label: "校对" }],
  );
  expect(
    resolveImportTargets({ canTranslate: false, canProofread: false, format: "json" }),
  ).toEqual([]);
});

test("offers both text fields only for PopRaKo documents", () => {
  expect(resolveImportTargets({ canTranslate: true, canProofread: true, format: "json" })).toEqual([
    { value: "translation", label: "翻译" },
    { value: "proofread", label: "校对" },
    { value: "both", label: "翻译+校对" },
  ]);
  expect(resolveImportTargets({ canTranslate: true, canProofread: true, format: "lp" })).toEqual([
    { value: "translation", label: "翻译" },
    { value: "proofread", label: "校对" },
  ]);
});

test("defaults to the first target and titles single-target dialogs by target", () => {
  const translationOnly = resolveImportTargets({
    canTranslate: true,
    canProofread: false,
    format: "lp",
  });
  const bothRoles = resolveImportTargets({
    canTranslate: true,
    canProofread: true,
    format: "json",
  });
  expect(defaultImportTarget(translationOnly)).toBe("translation");
  expect(importDialogTitle(translationOnly)).toBe("导入翻译");
  expect(importDialogTitle([{ value: "proofread", label: "校对" }])).toBe("导入校对");
  expect(importDialogTitle(bothRoles)).toBe("导入翻校");
});
