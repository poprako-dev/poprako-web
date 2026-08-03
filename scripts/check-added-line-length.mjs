import crypto from "node:crypto";
import fs from "node:fs";
import process from "node:process";
import childProcess from "node:child_process";

const baseSha = process.argv[2];
const baselineFile = process.argv[3];

if (!baseSha || !baselineFile) {
  console.error("Usage: check-added-line-length.mjs <base-sha> <baseline-file>");
  process.exit(2);
}

const baseline = new Set(
  fs
    .readFileSync(baselineFile, "utf8")
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#")),
);
const diff = childProcess.execFileSync(
  "git",
  ["diff", "--unified=0", "--no-color", baseSha, "HEAD", "--", "*.ts", "*.tsx"],
  { encoding: "utf8" },
);

function hashLine(file, line) {
  return crypto.createHash("sha256").update(`${file}\0${line}`).digest("hex");
}

let file = "";
let lineNumber = 0;
let failed = false;

for (const diffLine of diff.split("\n")) {
  if (diffLine.startsWith("+++ b/")) {
    file = diffLine.slice(6);
    continue;
  }

  if (diffLine.startsWith("@@ ")) {
    const match = diffLine.match(/\+(\d+)/);
    lineNumber = match ? Number(match[1]) : 0;
    continue;
  }

  if (diffLine.startsWith("+") && !diffLine.startsWith("+++")) {
    const sourceLine = diffLine.slice(1).replace(/\r$/, "");
    const isOverlong = [...sourceLine].length > 100;
    const isGrandfathered = baseline.has(hashLine(file, sourceLine));

    if (isOverlong && !isGrandfathered) {
      console.error(`${file}:${lineNumber}: added line exceeds 100 characters`);
      failed = true;
    }

    lineNumber += 1;
    continue;
  }

  if (!diffLine.startsWith("-")) {
    lineNumber += 1;
  }
}

if (failed) process.exit(1);
