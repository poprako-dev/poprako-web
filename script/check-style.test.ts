import assert from "node:assert/strict";
import { test } from "node:test";
import { inspectStyleFile } from "./check-style.ts";

void test("style checker accepts the registered Storybook default export", () => {
  assert.deepEqual(inspectStyleFile(".storybook/main.ts", "export default {};\n"), []);
});

void test("style checker permits only the router register module augmentation", () => {
  assert.deepEqual(
    inspectStyleFile(
      "src/application/router.ts",
      'declare module "@tanstack/react-router" { interface Register { router: Router; } }',
    ),
    [],
  );
  assert.match(
    inspectStyleFile(
      "src/shared/utility/other.ts",
      'declare module "@tanstack/react-router" { interface Register { value: string; } }',
    )
      .map((finding) => finding.rule)
      .join(" "),
    /type\.interface-data/u,
  );
});

void test("style checker rejects old structure, data interfaces and arrow exports", () => {
  const findings = inspectStyleFile(
    "src/features/sample/business/sample.ts",
    [
      "export interface Data { value: string }",
      "export const doWork = () => true;",
      "export default Data;",
      "export function lengthBoundary() { return 1; }",
    ].join("\n"),
  );
  assert.match(findings.map((finding) => finding.rule).join(" "), /structure\.features/u);
  assert.match(findings.map((finding) => finding.rule).join(" "), /type\.interface-data/u);
  assert.match(findings.map((finding) => finding.rule).join(" "), /function\.named/u);
  assert.match(findings.map((finding) => finding.rule).join(" "), /export\.default/u);
});

void test("style checker enforces the physical 400-line limit", () => {
  assert.deepEqual(inspectStyleFile("src/shared/utility/small.ts", `${"\n".repeat(399)}\n`), []);
  assert.match(
    inspectStyleFile("src/shared/utility/large.ts", `${"\n".repeat(400)}\n`)
      .map((finding) => finding.rule)
      .join(" "),
    /size\.lines/u,
  );
});
