import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { checkFunctionLines, discoverSourceFiles } from "../linters/function-lines/scan.ts";

function writeFixture(root: string, path: string, content: string): void {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), content);
}

function withFixture(run: (root: string) => void | Promise<void>): Promise<void> {
  const root = mkdtempSync(join(tmpdir(), "function-lines-"));
  return Promise.resolve()
    .then(() => run(root))
    .finally(() => {
      rmSync(root, { recursive: true, force: true });
    });
}

void test("source discovery includes owned code and excludes generated, declaration and output files", async () => {
  await withFixture((root) => {
    const included = [
      "src/work.ts",
      "script/work.test.ts",
      "linters/function-lines/check.ts",
      ".storybook/preview.ts",
      "test-resource/fixture.ts",
      "vite.config.ts",
      "eslint.config.js",
      "script/browser.mjs",
      "src/Page.jsx",
    ];
    const excluded = [
      "src/types.d.ts",
      "src/types.d.mts",
      "src/route-tree.gen.ts",
      "src/test-resource/generated/work.ts",
      "test-resource/generated/work.ts",
      "src/dist/work.ts",
      "src/node_modules/work.ts",
      "node_modules/work.ts",
      "coverage/work.ts",
      "dist/work.ts",
      "storybook-static/work.ts",
      "vite.config.ts.timestamp-123.mjs",
      "README.md",
    ];
    for (const path of [...included, ...excluded]) writeFixture(root, path, "function work() {}");
    assert.deepEqual(discoverSourceFiles(root), included.sort());
  });
});

void test("repository scanning reports violations in tests and in the linter itself", async () => {
  await withFixture((root) => {
    const source = ["function work() {", ...Array.from({ length: 49 }, () => "// line"), "}"].join(
      "\n",
    );
    writeFixture(root, "script/work.test.ts", source);
    writeFixture(root, "linters/function-lines/inspect.ts", source);
    writeFixture(root, "src/route-tree.gen.ts", source);
    const findings = checkFunctionLines(root);
    assert.deepEqual(
      findings.map(({ file }) => file),
      ["linters/function-lines/inspect.ts", "script/work.test.ts"],
    );
    assert.ok(findings.every(({ actual }) => actual === 51));
  });
});

async function runFixtureCli(root: string): Promise<{ code: number; text: string }> {
  const directory = "linters/function-lines";
  const sourceDirectory = fileURLToPath(new URL("../linters/function-lines/", import.meta.url));
  for (const name of ["check.ts", "scan.ts", "inspect.ts", "function-node.ts"]) {
    const content = readFileSync(join(sourceDirectory, name), "utf8");
    writeFixture(
      root,
      `${directory}/${name}`,
      content.replace('from "typescript"', 'from "npm:typescript@6.0.3"'),
    );
  }

  const command = new Deno.Command(Deno.execPath(), {
    args: ["run", "-A", "--no-config", "--no-lock", `${directory}/check.ts`],
    cwd: new URL(`file://${root}/`),
    stdout: "piped",
    stderr: "piped",
  });
  const child = command.spawn();
  const [status, stdout, stderr] = await Promise.all([
    child.status,
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
  ]);
  return { code: status.code, text: stdout + stderr };
}

void test("CLI returns zero for passing repositories and one for violations with locations", async () => {
  await withFixture(async (root) => {
    writeFixture(root, "src/pass.ts", "function work() {}");
    const pass = await runFixtureCli(root);
    assert.equal(pass.code, 0, pass.text);
    assert.match(pass.text, /Function logic \(50 lines\).*passed/u);

    writeFixture(
      root,
      "src/fail.ts",
      ["function fail() {", ...Array.from({ length: 49 }, () => "// line"), "}"].join("\n"),
    );
    const fail = await runFixtureCli(root);
    assert.equal(fail.code, 1, fail.text);
    assert.match(
      fail.text,
      /src\/fail\.ts:1:1 function\.lines: fail has 51 physical lines \(limit 50\)/u,
    );
  });
});

void test("linter implementation satisfies its own limits", () => {
  const root = fileURLToPath(new URL("../", import.meta.url));
  const findings = checkFunctionLines(root).filter(
    ({ file }) => file.startsWith("linters/") || /^script\/function-lines.*\.test\.ts$/u.test(file),
  );
  assert.deepEqual(findings, []);
});
