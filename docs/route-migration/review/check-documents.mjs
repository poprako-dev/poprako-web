// Read-only validation of the planning package; this does not run migration tasks.
import { readFile, readdir } from "node:fs/promises";
import { resolve, relative, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repository = resolve(packageRoot, "../..");
const baseline = "68cedc0943923843396f1120f44d9caeec8f160c";
const errors = [];

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if (character === "\n" && !quoted) {
      row.push(cell.replace(/\r$/, ""));
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  const headers = rows.shift();
  return rows.map((fields) => Object.fromEntries(headers.map((key, i) => [key, fields[i]])));
}

async function walk(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) result.push(...await walk(path));
    else result.push(path);
  }
  return result;
}

function git(args) {
  return execFileSync("git", args, { cwd: repository, encoding: "utf8" }).trim();
}

const inputs = git(["ls-tree", "-r", "--name-only", baseline]).split("\n");
const inventory = parseCsv(await readFile(resolve(packageRoot, "migration/file-map.csv"), "utf8"));
const additions = parseCsv(await readFile(resolve(packageRoot, "migration/new-files.csv"), "utf8"));
const documents = await walk(packageRoot);
const sources = new Set(inventory.map((row) => row.source));
if (sources.size !== inventory.length) errors.push("Duplicate source identity in file-map");
for (const input of inputs) if (!sources.has(input)) errors.push(`Missing source: ${input}`);
for (const source of sources) if (!inputs.includes(source)) errors.push(`Unknown source: ${source}`);

const planPaths = documents.filter((path) => /^P\d{3}-.*\.md$/.test(basename(path)));
const plans = new Map(planPaths.map((path) => [basename(path).slice(0, 4), path]));
if (plans.size !== 12) errors.push(`Expected 12 plans, found ${plans.size}`);
const counts = {};
for (const row of [...inventory, ...additions]) {
  if (!plans.has(row.plan)) errors.push(`Unknown plan: ${row.plan}`);
  if (row.source) counts[row.plan] = (counts[row.plan] ?? 0) + 1;
  for (const target of row.target.split(";").filter(Boolean)) {
    if (target.split("/").includes("features")) errors.push(`Forbidden target: ${target}`);
    if (/^src\/(api|types|store|pages|layouts|features|router|hooks?|components|lib|utils|config|stories)\//.test(target)) {
      errors.push(`Old classification target: ${target}`);
    }
    if (target.startsWith("src/") && target.endsWith(".ts")) {
      if (!/^[a-z][a-z0-9-]*(?:\.(?:test|d|gen))?\.ts$/.test(basename(target))) {
        errors.push(`Invalid TS target name: ${target}`);
      }
    }
  }
}

const dependencies = new Map();
for (const [id, path] of plans) {
  const content = await readFile(path, "utf8");
  const line = content.split("\n").find((item) => item.startsWith("前置工作包："));
  dependencies.set(id, [...(line?.matchAll(/P\d{3}/g) ?? [])].map((match) => match[0]));
  for (const row of inventory.filter((item) => item.plan === id)) {
    if (!content.includes(`\`${row.source}\``)) errors.push(`${id} missing source table row: ${row.source}`);
  }
  for (const row of additions.filter((item) => item.plan === id)) {
    if (!content.includes(`\`${row.target}\``)) errors.push(`${id} missing new file: ${row.target}`);
  }
}

function visit(id, ancestors) {
  if (ancestors.includes(id)) {
    errors.push(`Dependency cycle: ${[...ancestors, id].join(" -> ")}`);
    return;
  }
  for (const dependency of dependencies.get(id) ?? []) {
    if (!plans.has(dependency)) errors.push(`Unknown dependency: ${id} -> ${dependency}`);
    else visit(dependency, [...ancestors, id]);
  }
}
for (const id of plans.keys()) visit(id, []);

let checkedLinks = 0;
for (const path of documents.filter((item) => item.endsWith(".md"))) {
  const text = await readFile(path, "utf8");
  text.split("\n").forEach((line, index) => {
    if (/[\t ]+$/.test(line)) errors.push(`Trailing whitespace: ${relative(packageRoot, path)}:${index + 1}`);
  });
  for (const match of text.matchAll(/\[[^\]]*\]\(([^\s)]+)\)/g)) {
    const href = match[1];
    if (/^(https?:|#)/.test(href)) continue;
    const target = resolve(dirname(path), href.split("#")[0]);
    checkedLinks += 1;
    try {
      await readFile(target);
    } catch {
      errors.push(`Broken link: ${relative(packageRoot, path)} -> ${href}`);
    }
  }
}

const matrix = await readFile(resolve(packageRoot, "requirements-matrix.md"), "utf8");
const requirementIds = [...matrix.matchAll(/^\| (R\d-\d+) \|/gm)].map((match) => match[1]);
if (new Set(requirementIds).size !== requirementIds.length) errors.push("Duplicate requirement ID");
const coverage = await readFile(resolve(packageRoot, "review/coverage-matrix.md"), "utf8");
const coveredIds = [...coverage.matchAll(/^\| (R\d-\d+) /gm)].map((match) => match[1]);
if (new Set(coveredIds).size !== coveredIds.length) errors.push("Duplicate coverage requirement ID");
for (const id of requirementIds) if (!coveredIds.includes(id)) errors.push(`Uncovered requirement: ${id}`);
for (const id of coveredIds) if (!requirementIds.includes(id)) errors.push(`Unknown coverage requirement: ${id}`);
const outsideChanges = git(["diff", "--name-only", baseline]).split("\n").filter(Boolean)
  .filter((path) => !path.startsWith("docs/route-migration/"));
console.log(JSON.stringify({
  baseline,
  baselineFiles: inputs.length,
  mappedFiles: inventory.length,
  newFileResponsibilities: additions.length,
  requirements: requirementIds.length,
  plans: plans.size,
  sourceCountsByPlan: counts,
  checkedLocalLinks: checkedLinks,
  nonDocumentationChangesSinceBaseline: outsideChanges,
  errors,
}, null, 2));
if (errors.length > 0) process.exitCode = 1;
