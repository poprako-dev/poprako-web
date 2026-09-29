import { checkDependencies } from "./check-dependency.ts";
import { checkStyle } from "./check-style.ts";
import { checkDirectories } from "./check-directory.ts";
import { checkAppearance } from "./check-appearance.ts";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("../", import.meta.url)));
const findings = [
  ...checkDirectories(root),
  ...checkStyle(root),
  ...checkDependencies(root),
  ...checkAppearance(root),
];
if (findings.length > 0) {
  for (const finding of findings) {
    console.error(`${finding.file}:${String(finding.line)} ${finding.rule}: ${finding.message}`);
  }
  Deno.exitCode = 1;
} else {
  console.log("Project structure, naming, size, exports, and import boundaries passed.");
}
