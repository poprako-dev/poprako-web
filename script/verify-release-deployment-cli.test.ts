import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { chmod, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { test } from "vitest";

const execute = promisify(execFile);
const sha = "a".repeat(40);

async function runGate(fail: boolean): Promise<{ success: boolean; calls: string[][] }> {
  const root = await mkdtemp(join(tmpdir(), "poprako-release-gate-"));
  try {
    await writeFakeGitHub(root);
    let success = true;
    try {
      await execute(
        process.execPath,
        [new URL("./verify-release-deployment.ts", import.meta.url).pathname, sha],
        {
          env: {
            ...process.env,
            PATH: `${root}:${process.env["PATH"] ?? ""}`,
            GITHUB_REPOSITORY: "poprako-dev/poprako-web",
            GATE_CALLS: join(root, "calls"),
            GATE_FAIL: fail ? "1" : "0",
          },
        },
      );
    } catch {
      success = false;
    }
    const calls = (await readFile(join(root, "calls"), "utf8"))
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as string[]);
    return { success, calls };
  } finally {
    await rm(root, { recursive: true });
  }
}

async function writeFakeGitHub(root: string): Promise<void> {
  await writeFile(
    join(root, "gh"),
    `#!${process.execPath}
const fs = require("node:fs");
const args = process.argv.slice(2);
fs.appendFileSync(process.env.GATE_CALLS, JSON.stringify(args) + "\\n");
if (process.env.GATE_FAIL === "1") process.exit(1);
const result = args.at(-1).includes("/statuses?")
  ? [[{ state: "inactive", environment: "production" }],
     [{ state: "success", environment: "production" }]]
  : [[{ id: 42, sha: "${sha}", environment: "production" }]];
process.stdout.write(JSON.stringify(result));
`,
  );
  await chmod(join(root, "gh"), 0o755);
}

test("release CLI requests every deployment and status page using read-only API calls", async () => {
  const result = await runGate(false);
  assert.equal(result.success, true);
  assert.equal(result.calls.length, 2);
  for (const args of result.calls) {
    assert.deepEqual(args.slice(0, 5), ["api", "--method", "GET", "--paginate", "--slurp"]);
    assert.ok(args.includes("X-GitHub-Api-Version: 2026-03-10"));
    assert.ok(args.at(-1)?.startsWith("repos/poprako-dev/poprako-web/deployments"));
    assert.ok(args.at(-1)?.includes("per_page=100"));
  }
});

test("release CLI exits unsuccessfully when GitHub API fails", async () => {
  const result = await runGate(true);
  assert.equal(result.success, false);
  assert.equal(result.calls.length, 1);
});
