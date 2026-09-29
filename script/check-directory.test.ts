import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkDirectories, inspectDirectory } from "./check-directory.ts";

void test("directory vocabulary permits API exception, singular words and route syntax", () => {
  for (const path of [
    "src/api",
    "src/route/business",
    "src/route/status",
    "src/route/(setting)",
    "src/route/_authenticated",
    "src/route/translator/$chapterId",
  ]) {
    assert.deepEqual(inspectDirectory(path), [], path);
  }
  for (const path of [
    "src/routes",
    "src/features",
    "src/route/settings",
    "src/shared/utilities",
    "src/api/utils",
    "src/route/(utilities)",
  ]) {
    assert.ok(inspectDirectory(path).length > 0, path);
  }
});

void test("directory checking includes empty and asset-only directories", () => {
  const root = mkdtempSync(join(tmpdir(), "poprako-directory-"));
  try {
    mkdirSync(join(root, "src/route/settings"), { recursive: true });
    mkdirSync(join(root, "public/images"), { recursive: true });
    const paths = checkDirectories(root).map((finding) => finding.file);
    assert.ok(paths.includes("src/route/settings"));
    assert.ok(paths.includes("public/images"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

void test("concrete page names keep their URLs without permitting plural utility directories", () => {
  for (const page of ["settings", "utilities"]) {
    assert.deepEqual(inspectDirectory(`src/route/_authenticated/_shell/${page}`), []);
    assert.ok(inspectDirectory(`src/shared/${page}`).length > 0);
    assert.ok(inspectDirectory(`src/route/_authenticated/_shell/business/${page}`).length > 0);
  }
});
