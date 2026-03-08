#!/usr/bin/env node
const { execSync } = require("child_process");
const path = require("path");

const args = process.argv.slice(2);
if (!args.length) {
  console.error("Usage: run-line-check.js <file1> [file2 ...]");
  process.exit(2);
}

const max = 100;
const offending = [];

for (const f of args) {
  const rel = f;
  const abs = path.resolve(process.cwd(), rel);
  try {
    const out = execSync(
      `bun run scripts/check-line-length.ts "${abs}" ${max}`,
      { encoding: "utf8" },
    );
    let arr = [];
    try {
      arr = JSON.parse(out);
    } catch (e) {
      console.error("Failed to parse check output for", rel, e.message);
      process.exit(2);
    }
    if (Array.isArray(arr) && arr.length) {
      offending.push({ file: rel, lines: arr });
    }
  } catch (e) {
    console.error("Error running line check for", rel, e.message);
    process.exit(2);
  }
}

if (offending.length) {
  const files = offending.map((o) => o.file).join(", ");
  console.log(JSON.stringify({ ok: false, offending }));
  console.log("\nLine-length check FAILED for files:", files);
  console.log(
    "Please refactor long Tailwind class attribute lines into grouped expressions using clsx.",
  );
  process.exit(1);
}

console.log(JSON.stringify({ ok: true }));
process.exit(0);
