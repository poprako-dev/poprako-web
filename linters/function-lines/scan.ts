import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { inspectFunctionLines, type FunctionLineFinding } from "./inspect.ts";

const SOURCE_DIRECTORIES = ["src", "script", "linters", ".storybook", "test-resource"];
const EXCLUDED_NAMES = new Set(["node_modules", ".git", "dist", "coverage", "storybook-static"]);
const GENERATED_DIRECTORIES = new Set(["test-resource/generated", "src/test-resource/generated"]);

function isSourceFile(path: string): boolean {
  return (
    /\.(?:[cm]?[jt]s|[jt]sx)$/u.test(path) &&
    !/\.d\.[cm]?ts$/u.test(path) &&
    path !== "src/route-tree.gen.ts" &&
    !/\.timestamp-[^/]+\.mjs$/u.test(path)
  );
}

function collectDirectory(root: string, directory: string, files: string[]): void {
  if (GENERATED_DIRECTORIES.has(directory) || !existsSync(join(root, directory))) return;

  for (const entry of readdirSync(join(root, directory), { withFileTypes: true })) {
    if (EXCLUDED_NAMES.has(entry.name)) continue;

    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) collectDirectory(root, path, files);
    else if (entry.isFile() && isSourceFile(path)) files.push(path);
  }
}

export function discoverSourceFiles(root: string): string[] {
  const files: string[] = [];
  for (const directory of SOURCE_DIRECTORIES) collectDirectory(root, directory, files);

  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (entry.isFile() && isSourceFile(entry.name)) files.push(entry.name);
  }

  return files.sort();
}

export function checkFunctionLines(root: string): FunctionLineFinding[] {
  return discoverSourceFiles(root).flatMap((file) =>
    inspectFunctionLines(file, readFileSync(join(root, file), "utf8")),
  );
}
