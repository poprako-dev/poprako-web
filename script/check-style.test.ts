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

void test("route entry exports cannot silently disable lazy component splitting", () => {
  const route = 'export const Route = createFileRoute("/sample")({ component: Page });';
  const file = "src/route/sample/Index.tsx";
  for (const page of [
    "export function Page() { return null; }",
    "function Page() { return null; } export { Page };",
  ]) {
    assert.ok(
      inspectStyleFile(file, route + page).some((item) => item.rule === "route.lazy-export"),
    );
  }
  assert.deepEqual(inspectStyleFile(file, route + "function Page() { return null; }"), []);
});

void test("TSX always uses PascalCase, including route entries and tests", () => {
  for (const name of ["index.tsx", "route.tsx", "settings.tsx", "use-session.test.tsx"]) {
    assert.ok(
      inspectStyleFile(`src/route/settings/${name}`, "").some(
        (finding) => finding.rule === "naming.file",
      ),
      name,
    );
  }
  for (const name of ["Index.tsx", "Route.tsx", "Settings.tsx", "UseSession.test.tsx"]) {
    assert.deepEqual(inspectStyleFile(`src/route/settings/${name}`, ""), [], name);
  }
  assert.ok(
    inspectStyleFile("src/shared/utility/Session.test.ts", "").some(
      (finding) => finding.rule === "naming.file",
    ),
  );
  assert.deepEqual(inspectStyleFile("src/shared/utility/session.test.ts", ""), []);
  assert.deepEqual(inspectStyleFile("src/route/__root.ts", ""), []);
});
