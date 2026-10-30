import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { chmod, copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { test } from "vitest";
import { promisify } from "node:util";

const execute = promisify(execFile);

const staticChecks = [
  "run format:check",
  "run typecheck",
  "run lint",
  "run lint:function-lines",
  "run project:check",
  "run generate:check",
  "run test:unit",
  "run test:integration",
  "run test:script --exclude script/translator-undo-browser.test.ts",
];
const browserChecks = [
  "exec playwright install --with-deps chromium",
  "run test:translator-undo-browser",
  "run test:storybook",
  "run test:storybook-start",
  "run test:compress-browser",
  "run test:bounded-browser",
];
const buildChecks = ["exec vite build", "run build-storybook", "deployment"];

async function writeFakeExecutables(root: string): Promise<void> {
  await writeFile(
    `${root}/bin/pnpm`,
    `#!/bin/sh
if [ "$1" = --version ]; then printf '12.11.2\n'; exit 0; fi
printf '%s\n' "$*" >> "$CI_TASK_LOG"
if [ "$*" = "$CI_FAIL_TASK" ]; then exit 1; fi
`,
  );
  await chmod(`${root}/bin/pnpm`, 0o755);
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
      new URL("./assert-js-version.sh", import.meta.url),
    ]) {
      await copyFile(source, `${root}/script/${basename(source.pathname)}`);
    }
    await writeFile(`${root}/script/assert-js-version.sh`, "#!/bin/sh\nexit 0\n");
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
  test(`CI ${suite} suite runs its correctness checks`, async () => {
    const result = await runSuite(suite);
    assert.equal(result.success, true);
    assert.deepEqual(result.calls.slice(0, 2), [
      "install --frozen-lockfile",
      "run prepare:dependencies",
    ]);
    assert.deepEqual(result.calls.slice(2).sort(), [...checks].sort());
    if (suite === "browser") {
      assert.ok(
        result.calls.indexOf("exec playwright install --with-deps chromium") <
          result.calls.indexOf("run test:translator-undo-browser"),
      );
    }
  });
}

test("default CI covers every suite with one typecheck and both builds", async () => {
  const result = await runSuite();
  assert.equal(result.success, true);
  assert.deepEqual(result.calls.slice(0, 2), [
    "install --frozen-lockfile",
    "run prepare:dependencies",
  ]);
  assert.deepEqual(
    result.calls.slice(2).sort(),
    [...staticChecks, ...browserChecks, ...buildChecks].sort(),
  );
});

test("CI fails on an unsuccessful correctness check", async () => {
  const result = await runSuite("static", "run lint");
  assert.equal(result.success, false);
  assert.ok(result.calls.includes("run lint"));
  assert.ok(
    result.calls.includes("run test:script --exclude script/translator-undo-browser.test.ts"),
  );
});

test("CI fails when translator undo browser checks fail", async () => {
  const result = await runSuite("browser", "run test:translator-undo-browser");
  assert.equal(result.success, false);
  assert.ok(!result.calls.includes("run test:storybook"));
});

test("CI rejects function line violations before running source tests", async () => {
  const result = await runSuite("static", "run lint:function-lines");
  assert.equal(result.success, false);
  assert.ok(result.calls.includes("run lint:function-lines"));
  assert.ok(!result.calls.includes("run test:unit"));
});

test("unknown CI suites fail before dependency installation", async () => {
  const result = await runSuite("missing");
  assert.equal(result.success, false);
  assert.deepEqual(result.calls, []);
});
