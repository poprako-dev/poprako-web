import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { expect, test } from "vitest";

const run = promisify(execFile);
const separateVolumes = `
import fs from "node:fs/promises";
import { dirname, sep } from "node:path";
import { syncBuiltinESMExports } from "node:module";
const rename = fs.rename;
fs.rename = async (source, destination) => {
  if (String(destination).endsWith("route-tree.gen.ts")) {
    const volume = dirname(dirname(String(destination))) + sep;
    if (!String(source).startsWith(volume)) {
      throw Object.assign(new Error("EXDEV: cross-device link not permitted"), { code: "EXDEV" });
    }
    process.stdout.write("route-tree rename stayed on its volume\\n");
  }
  return rename(source, destination);
};
syncBuiltinESMExports();
`;

test("route checks work when the system temp directory is on a separate volume", async () => {
  const tree = resolve("src/route-tree.gen.ts");
  const original = await readFile(tree, "utf8");
  const preload = `data:text/javascript,${encodeURIComponent(separateVolumes)}`;
  const result = await run(process.execPath, [
    "--import",
    preload,
    "script/generate.ts",
    "--check",
  ]);
  expect(result.stdout).toContain("route-tree rename stayed on its volume");
  expect(await readFile(tree, "utf8")).toBe(original);
});
