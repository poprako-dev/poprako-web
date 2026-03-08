#!/usr/bin/env bun
import { readFileSync } from "fs";

function usage() {
  console.error(
    "Usage: bun run scripts/check-line-length.ts <file-path> [max=100]",
  );
  process.exit(2);
}

const file = process.argv[2];
if (!file) usage();
const max = Number(process.argv[3] ?? 100);
if (Number.isNaN(max) || max < 0) {
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

const lines = content.split(/\r?\n/);
const result: number[] = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].length > max) result.push(i + 1);
}

console.log(JSON.stringify(result));
