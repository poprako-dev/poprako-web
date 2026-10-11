import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  STORYBOOK_STORY_GLOBS,
  VITEST_INTEGRATION_INCLUDE,
  VITEST_UNIT_INCLUDE,
  VITEST_SCRIPT_INCLUDE,
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
    const character = normalized.charAt(index);
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
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const child = relative.length === 0 ? entry.name : `${relative}/${entry.name}`;
    if (entry.isDirectory()) {
      files.push(...(await discoverFiles(root, bucket, child)));
      continue;
    }
    if (entry.isFile() && isTestOrStoryFile(child)) {
      files.push(`${bucket}/${child}`);
    }
  }
  return files;
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
  if (scriptRoot && file.startsWith(`${scriptRoot}/`) && matchesAny(file, VITEST_SCRIPT_INCLUDE)) {
    owners.push("vitest:script");
  }
  return owners;
}

export async function buildTestInventory(root: string): Promise<TestInventory> {
  const config = JSON.parse(await readFile(`${root}/package.json`, "utf8")) as {
    scripts?: Record<string, unknown>;
  };
  const scriptRoot =
    config.scripts?.["test:script"] === "vitest run --config vitest.script.config.ts"
      ? "script"
      : null;
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
      file: "package.json#scripts.test:script",
      runners: [],
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
    process.exitCode = 1;
  } else {
    console.log(
      `Test inventory passed: ${String(
        inventory.files.length,
      )} test/spec/story files each have exactly one runner.`,
    );
  }
}
