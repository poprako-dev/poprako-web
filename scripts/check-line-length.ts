#!/usr/bin/env bun
import { readFileSync } from "fs";
import path from "path";

function usage() {
  console.error(
    "Usage: bun run scripts/check-line-length.ts <absolute-file-path> [max=100]",
  );
  process.exit(2);
}

const file = process.argv[2];
if (!file) usage();
// Require an absolute path per spec
if (!path.isAbsolute(file)) {
  console.error("Provide an absolute file path.");
  process.exit(2);
}

const maxArg = process.argv[3];
const max = Number(maxArg ?? 100);
if (!Number.isFinite(max) || max < 0 || !Number.isInteger(max)) {
  console.error("Invalid max length. Provide a non-negative integer.");
  process.exit(2);
}

let content: string;
try {
  content = readFileSync(file, "utf8");
} catch (e) {
  console.error(`Failed to read file: ${e}`);
  process.exit(2);
}

// Remove BOM if present
if (content.charCodeAt(0) === 0xfeff) content = content.slice(1);

const lines = content.split(/\r?\n/);
const result: number[] = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.length > max) result.push(i + 1);
}

console.log(JSON.stringify(result));
