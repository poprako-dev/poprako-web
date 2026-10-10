import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { chmod, copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { test } from "node:test";
import { promisify } from "node:util";

const execute = promisify(execFile);

const staticChecks = [
  "task format:check",
  "task typecheck",
  "task lint",
  "task project:check",
  "task generate:check",
  "task test:unit",
  "task test:integration",
  "task test:script",
];
const browserChecks = [
  "run -A npm:playwright@1.63.0 install --with-deps chromium",
  "task test:storybook",
  "task test:compress-browser",
  "task test:bounded-browser",
];
const buildChecks = ["run -A npm:vite@8.0.16 build", "deployment"];

async function writeFakeExecutables(root: string): Promise<void> {
  await writeFile(
    `${root}/bin/deno`,
    `#!/bin/sh
if [ "$1" = --version ]; then printf 'deno 2.9.6\n'; exit 0; fi
printf '%s\n' "$*" >> "$CI_TASK_LOG"
if [ "$*" = "$CI_FAIL_TASK" ]; then exit 1; fi
`,
  );
  await chmod(`${root}/bin/deno`, 0o755);
  await writeFile(
    `${root}/script/test-deployment.sh`,
    `#!/bin/sh
printf 'deployment\n' >> "$CI_TASK_LOG"
`,
  );
}

async function runCiScript(
  root: string,
  suite: string | undefined,
  failingTask: string,
): Promise<boolean> {
  try {
    await execute("sh", [`${root}/script/ci-check.sh`, ...(suite ? [suite] : [])], {
      env: {
        ...process.env,
        PATH: `${root}/bin:${process.env["PATH"] ?? ""}`,
        CI_TASK_LOG: `${root}/calls`,
        CI_FAIL_TASK: failingTask,
      },
    });
    return true;
  } catch {
    return false;
  }
}

async function runSuite(
  suite?: string,
  failingTask = "",
): Promise<{
  success: boolean;
  calls: string[];
}> {
  const root = await mkdtemp(join(tmpdir(), "poprako-ci-check-"));
  try {
    await mkdir(`${root}/script`);
    await mkdir(`${root}/bin`);
    for (const source of [
      new URL("./ci-check.sh", import.meta.url),
      new URL("./assert-deno-version.sh", import.meta.url),
    ]) {
      await copyFile(source, `${root}/script/${basename(source.pathname)}`);
    }
    await writeFakeExecutables(root);
    const success = await runCiScript(root, suite, failingTask);
    const calls = await readCiCalls(root);
    return { success, calls };
  } finally {
    await rm(root, { recursive: true });
  }
}

async function readCiCalls(root: string): Promise<string[]> {
  try {
    return (await readFile(`${root}/calls`, "utf8")).trim().split("\n");
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return [];
    throw error;
  }
}

for (const [suite, checks] of [
  ["static", staticChecks],
  ["browser", browserChecks],
  ["build", buildChecks],
] as const) {
  void test(`CI ${suite} suite runs its correctness checks`, async () => {
    const result = await runSuite(suite);
    assert.equal(result.success, true);
    assert.deepEqual(result.calls.slice(0, 2), ["ci", "task prepare:dependencies"]);
    assert.deepEqual(result.calls.slice(2).sort(), [...checks].sort());
  });
}

void test("default CI covers every suite with one typecheck and no demo builds", async () => {
  const result = await runSuite();
  assert.equal(result.success, true);
  assert.deepEqual(result.calls.slice(0, 2), ["ci", "task prepare:dependencies"]);
  assert.deepEqual(
    result.calls.slice(2).sort(),
    [...staticChecks, ...browserChecks, ...buildChecks].sort(),
  );
});

void test("CI fails on an unsuccessful correctness check", async () => {
  const result = await runSuite("static", "task lint");
  assert.equal(result.success, false);
  assert.ok(result.calls.includes("task lint"));
  assert.ok(result.calls.includes("task test:script"));
});

void test("unknown CI suites fail before dependency installation", async () => {
  const result = await runSuite("missing");
  assert.equal(result.success, false);
  assert.deepEqual(result.calls, []);
});
