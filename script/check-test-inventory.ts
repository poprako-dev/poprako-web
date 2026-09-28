import { fileURLToPath } from "node:url";
import {
  STORYBOOK_STORY_GLOBS,
  VITEST_INTEGRATION_INCLUDE,
  VITEST_UNIT_INCLUDE,
} from "./test-runner-config.ts";

export type TestInventoryIssue = {
  file: string;
  runners: string[];
};

export type TestInventory = {
  files: string[];
  assignments: Record<string, string[]>;
  issues: TestInventoryIssue[];
};

type RunnerPattern = {
  name: string;
  patterns: string[];
};

function globExpression(pattern: string): RegExp {
  const normalized = pattern.replace(/^\.\.\//u, "");
  let source = "^";
  for (let index = 0; index < normalized.length; index++) {
    const character = normalized[index];
    if (character === "*" && normalized[index + 1] === "*") {
      index++;
      if (normalized[index + 1] === "/") {
        source += "(?:.*/)?";
        index++;
      } else {
        source += ".*";
      }
      continue;
    }
    if (character === "*") {
      source += "[^/]*";
      continue;
    }
    if (character === "@" && normalized[index + 1] === "(") {
      const end = normalized.indexOf(")", index + 2);
      if (end >= 0) {
        source += `(?:${normalized.slice(index + 2, end)})`;
        index = end;
        continue;
      }
    }
    source += character.replace(/[|\\{}()[\]^$+?.]/gu, "\\$&");
  }
  return new RegExp(`${source}$`, "u");
}

function matchesAny(file: string, patterns: string[]): boolean {
  return patterns.some((pattern) => globExpression(pattern).test(file));
}

function isTestOrStoryFile(file: string): boolean {
  return (
    /(?:\.(?:test|spec|stories)|_test)\.(?:[cm]?[jt]sx?)$/u.test(file) || file.endsWith(".mdx")
  );
}

async function discoverFiles(
  root: string,
  bucket: "src" | "script",
  relative = "",
): Promise<string[]> {
  const directory = relative.length === 0 ? root : `${root}/${relative}`;
  const files: string[] = [];
  for await (const entry of Deno.readDir(directory)) {
    const child = relative.length === 0 ? entry.name : `${relative}/${entry.name}`;
    if (entry.isDirectory) {
      files.push(...(await discoverFiles(root, bucket, child)));
      continue;
    }
    if (entry.isFile && isTestOrStoryFile(child)) {
      files.push(`${bucket}/${child}`);
    }
  }
  return files;
}

function denoTestRoot(denoConfig: { tasks?: Record<string, unknown> }): string | null {
  const task = denoConfig.tasks?.["test:script"];
  if (typeof task !== "string") {
    return null;
  }
  const match = /^deno\s+test\s+-A\s+([\w./-]+)$/u.exec(task.trim());
  return match?.[1] ?? null;
}

function hasDenoDiscoverySuffix(file: string): boolean {
  return /(?:_test|\.test)\.(?:[cm]?[jt]sx?)$/u.test(file);
}

export function assignTestRunners(file: string, scriptRoot: string | null): string[] {
  const runners: RunnerPattern[] = [
    { name: "vitest:unit", patterns: VITEST_UNIT_INCLUDE },
    { name: "vitest:integration", patterns: VITEST_INTEGRATION_INCLUDE },
    { name: "storybook:browser", patterns: STORYBOOK_STORY_GLOBS },
  ];
  const owners = runners
    .filter(({ patterns }) => matchesAny(file, patterns))
    .map(({ name }) => name);
  if (scriptRoot && file.startsWith(`${scriptRoot}/`) && hasDenoDiscoverySuffix(file)) {
    owners.push("deno:test-script");
  }
  return owners;
}

export async function buildTestInventory(root: string): Promise<TestInventory> {
  const denoConfig = JSON.parse(await Deno.readTextFile(`${root}/deno.json`)) as {
    tasks?: Record<string, unknown>;
  };
  const scriptRoot = denoTestRoot(denoConfig);
  const files = (
    await Promise.all([
      discoverFiles(`${root}/src`, "src"),
      discoverFiles(`${root}/script`, "script"),
    ])
  )
    .flat()
    .sort();
  const assignments: Record<string, string[]> = {};
  const issues: TestInventoryIssue[] = [];

  for (const file of files) {
    const owners = assignTestRunners(file, scriptRoot);
    assignments[file] = owners;
    if (owners.length !== 1) {
      issues.push({ file, runners: owners });
    }
  }

  if (scriptRoot !== "script") {
    issues.push({
      file: "deno.json#tasks.test:script",
      runners: scriptRoot ? [scriptRoot] : [],
    });
  }
  return { files, assignments, issues };
}

if (import.meta.main) {
  const root = fileURLToPath(new URL("../", import.meta.url)).replace(/\/$/u, "");
  const inventory = await buildTestInventory(root);
  if (inventory.issues.length > 0) {
    for (const issue of inventory.issues) {
      const owners = issue.runners.length === 0 ? "none" : issue.runners.join(", ");
      console.error(`${issue.file}: expected exactly one test runner, found ${owners}`);
    }
    Deno.exitCode = 1;
  } else {
    console.log(
      `Test inventory passed: ${String(
        inventory.files.length,
      )} test/spec/story files each have exactly one runner.`,
    );
  }
}
