import assert from "node:assert/strict";
import { test } from "vitest";
import { inspectOverlayFile } from "./check-overlay.ts";

const OVERLAY = [
  "export function Panel() {",
  "  return createPortal(",
  '    <div className="fixed inset-0 z-50 flex items-center justify-center">',
  '      <button type="button" aria-label="关闭" className="absolute inset-0 size-full" onClick={onClose} />',
  "      {content}",
  "    </div>,",
  "    document.body,",
  "  );",
  "}",
].join("\n");

test("overlay checker accepts content positioned above the backdrop", () => {
  const findings = inspectOverlayFile(
    "src/shared/component/Sample.tsx",
    OVERLAY.replace(
      "      {content}",
      '      <div className="relative w-full max-w-md" role="dialog">{children}</div>',
    ),
  );
  assert.deepEqual(findings, []);
});

test("overlay checker rejects content a full-size backdrop can cover", () => {
  const findings = inspectOverlayFile(
    "src/shared/component/Sample.tsx",
    OVERLAY.replace(
      "      {content}",
      '      <div className="w-full max-w-md" role="dialog">{children}</div>',
    ),
  );
  assert.deepEqual(
    findings.map((finding) => [finding.rule, finding.line]),
    [["overlay.backdrop-covers-content", 5]],
  );
});

test("overlay checker ignores portals without a full-size backdrop and plain markup", () => {
  assert.deepEqual(
    inspectOverlayFile(
      "src/shared/component/Sample.tsx",
      [
        "export function Panel() {",
        "  return createPortal(",
        '    <div className="fixed inset-0 z-50">',
        "      <section>content</section>",
        "    </div>,",
        "    document.body,",
        "  );",
        "}",
      ].join("\n"),
    ),
    [],
  );
  assert.deepEqual(
    inspectOverlayFile(
      "src/shared/component/Sample.tsx",
      'export function Panel() { return <div className="fixed inset-0" />; }',
    ),
    [],
  );
});

test("overlay checker also covers in-page overlays with a fixed backdrop", () => {
  const source = [
    "export function Drawer() {",
    "  return (",
    '    <div className="fixed inset-0 z-50 flex justify-end">',
    '      <button type="button" aria-label="关闭" className="fixed inset-0" onClick={onClose} />',
    '      <div className="w-full max-w-xs" role="dialog">content</div>',
    "    </div>",
    "  );",
    "}",
  ].join("\n");
  assert.deepEqual(
    inspectOverlayFile("src/shared/component/Drawer.tsx", source).map((finding) => finding.rule),
    ["overlay.backdrop-covers-content"],
  );
  assert.deepEqual(
    inspectOverlayFile(
      "src/shared/component/Drawer.tsx",
      source.replace('className="w-full max-w-xs"', 'className="relative w-full max-w-xs"'),
    ),
    [],
  );
});
