import assert from "node:assert/strict";
import { test } from "node:test";
import { inspectAppearanceFile } from "./check-appearance.ts";

void test("appearance checker inspects className and class helper expressions", () => {
  const findings = inspectAppearanceFile(
    "src/shared/component/Sample.tsx",
    [
      'const palette = "red-500";',
      'export function Sample() { return <div className={clsx("dark:bg-slate-900", { "text-[#123456]": true })} />; }',
    ].join("\n"),
  );
  assert.deepEqual(
    findings.map((finding) => finding.rule),
    ["appearance.dark-class", "appearance.raw-palette", "appearance.raw-palette"],
  );
});

void test("appearance checker covers adjacent classes, templates, top-level helpers and paint styles", () => {
  const findings = inspectAppearanceFile(
    "src/shared/component/Sample.tsx",
    [
      'const variants = cva("text-white px-2");',
      'export function Sample() { return <div className={clsx(`bg-blue-500 p-4 ${active ? "dark:text-slate-200" : ""}`, isOpen && "bg-green-500")} style={{ color: "#fff", background: "var(--color-green-500)" }}><svg><path fill="#fff" stroke="currentColor" /></svg></div>; }',
    ].join("\n"),
  );
  assert.equal(findings.filter((finding) => finding.rule === "appearance.raw-palette").length, 4);
  assert.equal(findings.filter((finding) => finding.rule === "appearance.dark-class").length, 1);
  assert.equal(findings.filter((finding) => finding.rule === "appearance.raw-color").length, 3);
});

void test("appearance checker permits transparent and inherited neutral utilities", () => {
  assert.deepEqual(
    inspectAppearanceFile(
      "src/shared/component/Sample.tsx",
      '<div className="bg-transparent text-current border-inherit" />',
    ),
    [],
  );
});

void test("white and black remain palette colors unless one exact media exception is documented", () => {
  const findings = inspectAppearanceFile(
    "src/shared/component/Sample.tsx",
    [
      'export function Sample() { return <><div className="bg-white" /><div className={/* appearance-exempt: content-color -- fixed backdrop behind comic artwork */ "bg-black"} /><div className={/* appearance-exempt: geometry -- blue bounds mark image dimensions */ "border-blue-500"} /></>; }',
    ].join("\n"),
  );
  assert.deepEqual(
    findings.map((finding) => finding.rule),
    ["appearance.raw-palette"],
  );
});

void test("appearance checker ignores tests, stories and plain data strings", () => {
  assert.deepEqual(
    inspectAppearanceFile("src/shared/component/Sample.test.tsx", '<div className="text-white" />'),
    [],
  );
  assert.deepEqual(
    inspectAppearanceFile("src/shared/model/color-name.ts", 'const label = "red-500";'),
    [],
  );
});

void test("appearance checker permits semantic CSS tokens and exact documented exceptions", () => {
  assert.deepEqual(
    inspectAppearanceFile(
      "src/application/style.css",
      [
        ":root {",
        "  --foreground: #101010;",
        "}",
        ".comic-image {",
        "  /* appearance-exempt: content-color -- fixed black backdrop around comic image */",
        "  background: #000;",
        "}",
      ].join("\n"),
    ),
    [],
  );
});

void test("appearance checker detects dark CSS and literal component colors", () => {
  const findings = inspectAppearanceFile(
    "src/application/feature.css",
    [".dark .panel {", "  color: #fff;", "}", "@media (prefers-color-scheme: dark) {"].join("\n"),
  );
  assert.deepEqual(
    findings.map((finding) => finding.rule),
    ["appearance.dark-css", "appearance.raw-css-color", "appearance.dark-css"],
  );
});

void test("CSS palette declarations are allowed only in the semantic root token block", () => {
  const findings = inspectAppearanceFile(
    "src/application/feature.css",
    [":root {", "  --foreground: #111;", "}", ".panel {", "  --local-color: #fff;", "}"].join("\n"),
  );
  assert.deepEqual(
    findings.map((finding) => finding.rule),
    ["appearance.raw-css-color"],
  );
});
