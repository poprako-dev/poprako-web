import assert from "node:assert/strict";
import { test } from "node:test";
import {
  inspectFunctionLines,
  type FunctionLineFinding,
} from "../linters/function-lines/inspect.ts";

function onlyFinding(file: string, source: string): FunctionLineFinding {
  const findings = inspectFunctionLines(file, source);
  assert.equal(findings.length, 1);
  const [finding] = findings;
  assert.ok(finding);
  return finding;
}

function functionSource(lines: number, opening = "function work() {", closing = "}"): string {
  return [opening, ...Array.from({ length: lines - 2 }, () => "  // physical line"), closing].join(
    "\n",
  );
}

function renderSource(lines: number): string {
  return [
    "  return (",
    "    <div>",
    ...Array.from({ length: lines - 4 }, () => "      <span />"),
    "    </div>",
    "  );",
  ].join("\n");
}

function componentSource(logic: number, render: number): string {
  return [
    "function Page() {",
    ...Array.from({ length: logic - 2 }, () => "  // logic line"),
    renderSource(render),
    "}",
  ].join("\n");
}

void test("function checker includes comments and blank lines at the 50/51 boundary", () => {
  assert.deepEqual(inspectFunctionLines("work.ts", functionSource(50)), []);
  const source = functionSource(51).replace("  // physical line", "");
  assert.deepEqual(inspectFunctionLines("work.ts", source), [
    {
      file: "work.ts",
      line: 1,
      column: 1,
      functionName: "work",
      rule: "function.lines",
      actual: 51,
      limit: 50,
    },
  ]);
});

void test("function checker includes multiline signatures, CRLF and the closing brace", () => {
  const source = functionSource(49).replace(
    "function work() {",
    "function work(\n  value: number,\n) {",
  );
  const finding = onlyFinding("work.ts", source.replaceAll("\n", "\r\n"));
  assert.equal(finding.actual, 51);
  assert.equal(finding.functionName, "work");
});

void test("function checker reports source positions after leading trivia", () => {
  const source = "// preceding comment\n\n  " + functionSource(51);
  const finding = onlyFinding("work.ts", source);
  assert.equal(finding.line, 3);
  assert.equal(finding.column, 3);
});

void test("function checker covers expressions, callbacks, methods, constructors and accessors", () => {
  const forms = [
    ["const work = () => {", "};", "work"],
    ["const work = function () {", "};", "work"],
    ["items.map(() => {", "});", "<anonymous>"],
    ["const object = { work() {", "} };", "work"],
    ["class Example { constructor() {", "} }", "constructor"],
    ["class Example { get value() {", "} }", "value"],
    ["class Example { set value(next) {", "} }", "value"],
    ["class Example { async *work() {", "} }", "work"],
  ];

  for (const [opening, closing, name] of forms) {
    const finding = onlyFinding("work.ts", functionSource(51, opening, closing));
    assert.equal(finding.functionName, name, opening);
    assert.equal(finding.actual, 51, opening);
  }
});

void test("nested functions are checked independently and remain part of the outer function", () => {
  const source = ["function outer() {", functionSource(51, "function inner() {"), "}"].join("\n");
  const findings = inspectFunctionLines("work.ts", source);
  assert.deepEqual(
    findings.map(({ functionName, actual }) => ({ functionName, actual })),
    [
      { functionName: "outer", actual: 53 },
      { functionName: "inner", actual: 51 },
    ],
  );
});

void test("bodyless signatures and function-looking text do not produce findings", () => {
  const source = [
    "declare function work(): void;",
    "interface Contract { work(): void; }",
    "type Callback = () => void;",
    `const example = ${JSON.stringify(functionSource(80))};`,
  ].join("\n");
  assert.deepEqual(inspectFunctionLines("work.ts", source), []);
});

void test("component logic and render returns have independent inclusive limits", () => {
  assert.deepEqual(inspectFunctionLines("Page.tsx", componentSource(50, 150)), []);
  assert.deepEqual(
    inspectFunctionLines("Page.tsx", componentSource(51, 151)).map(({ rule, actual, limit }) => ({
      rule,
      actual,
      limit,
    })),
    [
      { rule: "function.lines", actual: 51, limit: 50 },
      { rule: "component.return-lines", actual: 151, limit: 150 },
    ],
  );
});

void test("component return lines are aggregated across early and primary returns", () => {
  const source = componentSource(2, 150).replace(
    "function Page() {",
    "function Page() {\nif (empty) {\nreturn null;\n}",
  );
  assert.equal(onlyFinding("Page.tsx", source).actual, 151);

  const branches = [
    "function Page() {",
    "if (loading) {",
    renderSource(76),
    "}",
    renderSource(75),
    "}",
  ].join("\n");
  assert.equal(onlyFinding("Page.tsx", branches).actual, 151);
});

void test("implicit JSX returns of component arrows receive the 150-line render limit", () => {
  const source = renderSource(150).replace("  return (", "const Page = () => (");
  assert.deepEqual(inspectFunctionLines("Page.tsx", source), []);
  const finding = onlyFinding("Page.tsx", source.replace("    <div>", "    <div>\n<span />"));
  assert.equal(finding.rule, "component.return-lines");
  assert.equal(finding.actual, 151);
});

void test("callbacks inside component returns retain their own 50-line limit", () => {
  const callback = functionSource(51, "{(() => {", "})()}");
  const source = ["function Page() {", "return <div>", callback, "</div>;", "}"].join("\n");
  const finding = onlyFinding("Page.tsx", source);
  assert.equal(finding.functionName, "<anonymous>");
  assert.equal(finding.actual, 51);
});

void test("nested callback returns are not deducted from component logic", () => {
  const callback = [
    "const cleanup = () => {",
    "return (",
    ...Array.from({ length: 45 }, () => "  0 +"),
    "  0",
    ");",
    "};",
  ].join("\n");
  const source = ["function Page() {", callback, "return <div />;", "}"].join("\n");
  const finding = onlyFinding("Page.tsx", source);
  assert.equal(finding.functionName, "Page");
  assert.equal(finding.actual, 52);
});

void test("component return intervals sharing a physical line are counted only once", () => {
  const source = componentSource(50, 150).replace(
    "function Page() {",
    "function Page() { if (empty) return null; if (other) return null;",
  );
  assert.equal(onlyFinding("Page.tsx", source).actual, 151);
});

void test("ordinary functions and hooks cannot deduct their returns", () => {
  for (const opening of ["function work() {", "function usePage() {"]) {
    const source = componentSource(2, 60).replace("function Page() {", opening);
    const finding = onlyFinding("Page.tsx", source);
    assert.equal(finding.rule, "function.lines");
    assert.equal(finding.actual, 62);
  }

  assert.equal(onlyFinding("Page.tsx", functionSource(51, "function Factory() {")).actual, 51);
});

void test("JSX returned through a list callback identifies a named component", () => {
  const source = [
    "function Page() {",
    "return items.map(item => (",
    ...Array.from({ length: 47 }, () => "  // rendering"),
    "<div />));",
    "}",
  ].join("\n");
  assert.deepEqual(inspectFunctionLines("Page.tsx", source), []);
});

void test("JavaScript, MJS and JSX are parsed in their native script modes", () => {
  for (const file of ["work.js", "work.mjs", "work.cjs", "work.mts", "work.cts"]) {
    assert.equal(onlyFinding(file, functionSource(51)).actual, 51, file);
  }
  assert.deepEqual(inspectFunctionLines("Page.jsx", componentSource(50, 150)), []);
});
