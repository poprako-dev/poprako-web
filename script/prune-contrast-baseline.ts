import { spawn } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import { stripVTControlCharacters } from "node:util";
import {
  pruneContrastBaseline,
  parseContrastObservation,
  type ContrastEntry,
  type ContrastObservation,
} from "./contrast-baseline.ts";

type BaselineDocument = {
  reference: string;
  reason: string;
  stories: Record<string, ContrastEntry[]>;
};

async function collectAudits(): Promise<ContrastObservation[]> {
  const child = spawn(
    "pnpm",
    ["exec", "vitest", "run", "--config", "vitest.storybook.config.ts", "--project", "storybook"],
    {
      cwd: fileURLToPath(new URL("../", import.meta.url)),
      env: { ...process.env, VITE_CAPTURE_CONTRAST: "1", NO_COLOR: "1", FORCE_COLOR: "0" },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  const reports: string[] = [];
  for (const stream of [child.stdout, child.stderr]) {
    createInterface({ input: stream }).on("line", (raw) => {
      const line = stripVTControlCharacters(raw);
      const start = line.indexOf("CONTRAST_OBSERVATION ");
      if (start >= 0) reports.push(line.slice(start + "CONTRAST_OBSERVATION ".length));
      else process.stdout.write(raw + "\n");
    });
  }
  const status = await new Promise<number | null>((resolve, reject) => {
    child.once("error", reject);
    child.once("close", resolve);
  });
  if (status !== 0) throw new Error("Storybook run failed; contrast baseline was not changed");
  return reports.map(parseContrastObservation);
}

function countEntries(stories: Record<string, ContrastEntry[]>): number {
  return Object.values(stories)
    .flat()
    .reduce((total, entry) => total + entry.count, 0);
}

async function main(): Promise<void> {
  const baselineUrl = new URL("../.storybook/contrast-baseline.json", import.meta.url);
  const exceptionsUrl = new URL("../.storybook/contrast-exceptions.json", import.meta.url);
  const baseline = JSON.parse(await readFile(baselineUrl, "utf8")) as BaselineDocument;
  const exceptions = JSON.parse(await readFile(exceptionsUrl, "utf8")) as BaselineDocument;
  const observations = await collectAudits();
  const stories = pruneContrastBaseline(baseline.stories, observations, exceptions.stories);
  const observedIds = new Set(observations.map((observation) => observation.storyId));
  const unobserved = Object.keys(baseline.stories).filter((id) => !observedIds.has(id));
  const inconclusive = observations.filter((entry) =>
    entry.incompleteRules.includes("color-contrast"),
  );
  await writeFile(baselineUrl, JSON.stringify({ ...baseline, stories }, null, 2) + "\n");
  console.log(
    `Contrast allowances: ${String(countEntries(baseline.stories))} -> ${String(countEntries(stories))}; ` +
      `${String(observations.length)} audits; ${String(unobserved.length)} unobserved stories retained; ` +
      `${String(inconclusive.length)} inconclusive contrast audits retained.`,
  );
  if (unobserved.length > 0) console.log(`Unobserved: ${unobserved.join(", ")}`);
}

await main();
