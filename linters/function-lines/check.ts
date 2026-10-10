import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { checkFunctionLines } from "./scan.ts";

export function runFunctionLineCheck(root: string): number {
  const findings = checkFunctionLines(root);
  for (const finding of findings) {
    console.error(
      `${finding.file}:${String(finding.line)}:${String(finding.column)} ` +
        `${finding.rule}: ${finding.functionName} has ${String(finding.actual)} physical lines ` +
        `(limit ${String(finding.limit)})`,
    );
  }

  if (findings.length > 0) {
    console.error(`${String(findings.length)} function/return line limit violations.`);
    return 1;
  }

  console.log("Function logic (50 lines) and component returns (150 lines) passed.");
  return 0;
}

if (import.meta.main) {
  const root = resolve(fileURLToPath(new URL("../../", import.meta.url)));
  Deno.exitCode = runFunctionLineCheck(root);
}
