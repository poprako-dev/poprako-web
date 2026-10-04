import path from "node:path";
import { fileURLToPath } from "node:url";
import { storyReport } from "./contrast-story-report.mjs";
import { captureReference } from "./contrast-reference.mjs";
import { routeReport } from "./contrast-route-report.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.join(root, "test-resource/generated/contrast");
await Deno.mkdir(output, { recursive: true });

/** @param {string[]} args @param {string} name */
async function runCheck(args, name) {
  const result = await new Deno.Command(Deno.execPath(), {
    args,
    cwd: root,
    env: { POPRAKO_CONTRAST_EVIDENCE: "1" },
    stdout: "piped",
    stderr: "piped",
  }).output();
  const log = new TextDecoder().decode(result.stdout) + new TextDecoder().decode(result.stderr);
  await Deno.writeTextFile(path.join(output, `${name}.log`), log);
  return { success: result.success, log };
}

const stories = await runCheck(["task", "test:storybook"], "storybook");
const evidence = storyReport(stories.log, stories.success);
await Deno.writeTextFile(
  path.join(output, "storybook.json"),
  JSON.stringify(evidence, null, 2) + "\n",
);
console.log(
  `Storybook contrast: ${evidence.stories.length} audited scenes, ${evidence.passed ? "passed" : "failed"}`,
);
const routes = await runCheck(["run", "-A", "script/test-contrast-browser.mjs"], "routes");
let routePassed = false;
try {
  const report = JSON.parse(await Deno.readTextFile(path.join(output, "after/report.json")));
  const result = routeReport(report, routes.success);
  routePassed = result.passed;
  if (!routePassed) console.error(result.errors.join("; "));
} catch (error) {
  console.error(`Missing or invalid route report: ${String(error)}`);
}
console.log(
  routes.log.split("\n").find((line) => line.startsWith("Contrast:")) ??
    "Route audit failed before producing a report",
);
const reference = Deno.env.get("CONTRAST_REFERENCE_SHA");
if (reference) {
  try {
    await captureReference(root, reference, runCheck);
  } catch (error) {
    console.error(String(error));
    Deno.exitCode = 1;
  }
}
if (!evidence.passed || !routePassed) {
  console.error(`Contrast failed; inspect ${output}/storybook.log and ${output}/after/report.json`);
  Deno.exitCode = 1;
}
