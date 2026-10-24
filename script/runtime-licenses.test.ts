import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, test } from "vitest";
import { collectRuntimeLicenses, type LicensedPackage } from "./runtime-licenses.ts";

const roots: string[] = [];

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

async function fixture(name: string, license = "MIT"): Promise<LicensedPackage> {
  const directory = await mkdtemp(join(tmpdir(), "poprako-licenses-"));
  roots.push(directory);
  await writeFile(join(directory, "package.json"), JSON.stringify({ name, version: "1.0.0" }));
  return { name, license, paths: [directory], versions: ["1.0.0"] };
}

function directory(entry: LicensedPackage): string {
  const result = entry.paths[0];
  if (!result) throw new Error("Missing fixture path");
  return result;
}

test("retains copyright, full license, NOTICE and AUTHORS for worker dependencies", async () => {
  const entry = await fixture("worker-codec");
  for (const [file, text] of [
    ["LICENSE", "Copyright A. Permission granted. Disclaimer."],
    ["NOTICE.txt", "Additional attribution"],
    ["AUTHORS", "Original authors"],
  ]) {
    if (file && text) await writeFile(join(directory(entry), file), text);
  }
  const text = await collectRuntimeLicenses("", [entry]);
  expect(text).toContain("worker-codec@1.0.0 (MIT)");
  expect(text).toContain("Copyright A. Permission granted. Disclaimer.");
  expect(text).toContain("Additional attribution");
  expect(text).toContain("Original authors");
  expect(text).not.toContain(directory(entry));
});

test("fails the build for missing license texts and unreviewed identifiers", async () => {
  const missing = await fixture("missing");
  await writeFile(join(directory(missing), "AUTHORS"), "An author name is not a license");
  await writeFile(join(directory(missing), "LICENSE"), "\n");
  await expect(collectRuntimeLicenses("", [missing])).rejects.toThrow("Missing license text");
  const unreviewed = await fixture("new-dependency", "AGPL-3.0-only");
  await expect(collectRuntimeLicenses("", [unreviewed])).rejects.toThrow("Unreviewed license");
});

test("extracts the complete isarray README license without unrelated documentation", async () => {
  const entry = await fixture("isarray");
  await writeFile(
    join(directory(entry), "README.md"),
    "# Usage\nUnrelated text\n## License\nCopyright Julian\nPermission is hereby granted\nDisclaimer\n",
  );
  const text = await collectRuntimeLicenses("", [entry]);
  expect(text).toContain("Copyright Julian\nPermission is hereby granted\nDisclaimer");
  expect(text).not.toContain("Unrelated text");
});

test("includes pako's Zlib notice in addition to its package MIT text", async () => {
  const entry = await fixture("pako", "(MIT AND Zlib)");
  await writeFile(join(directory(entry), "LICENSE"), "MIT package license");
  await mkdir(join(directory(entry), "lib/zlib"), { recursive: true });
  await writeFile(
    join(directory(entry), "lib/zlib/deflate.js"),
    "'use strict';\n\n// (C) Original authors\n// Zlib restrictions\n\nconst implementation = 1;\n",
  );
  const text = await collectRuntimeLicenses("", [entry]);
  expect(text).toContain("MIT package license");
  expect(text).toContain("// (C) Original authors\n// Zlib restrictions");
  expect(text).not.toContain("const implementation");
});

test("uses the preserved upstream license when the npm package omitted it", async () => {
  const entry = await fixture("react-remove-scroll-bar");
  const root = await mkdtemp(join(tmpdir(), "poprako-license-root-"));
  roots.push(root);
  await mkdir(join(root, "public/license"), { recursive: true });
  const source = new URL("../public/license/react-remove-scroll-bar-LICENSE.txt", import.meta.url);
  const original = await readFile(source, "utf8");
  await writeFile(join(root, "public/license/react-remove-scroll-bar-LICENSE.txt"), original);
  const text = await collectRuntimeLicenses(root, [entry]);
  expect(text).toContain(original);
  expect(text).toContain("Copyright (c) 2025 Anton Korzunov");
});
