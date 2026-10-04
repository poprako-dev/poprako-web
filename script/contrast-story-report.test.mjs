import assert from "node:assert/strict";
import { storyReport } from "./contrast-story-report.mjs";

/** @returns {{violations: unknown[], contrast: {proofs: unknown[], unresolved: unknown[]}, nonText: {pairs: unknown[], failures: unknown[]}}} */
function evidence() {
  return {
    violations: [],
    contrast: { proofs: [], unresolved: [] },
    nonText: { pairs: [], failures: [] },
  };
}

/** @param {string} storyId @param {ReturnType<typeof evidence>} value */
function record(storyId, value = evidence()) {
  return `[vite] [console.warn] CONTRAST_STORY_EVIDENCE ${JSON.stringify({ storyId, evidence: value })}\n`;
}

Deno.test("story gate requires complete evidence as well as a successful test process", () => {
  const log = record("one") + record("two") + "Tests 2 passed (2)";
  assert.equal(storyReport(log, true).passed, true);
  assert.equal(storyReport(log.replace("Tests", "\u001b[32mTests\u001b[0m"), true).passed, true);
  assert.equal(storyReport(log, false).passed, false);
  assert.equal(storyReport(record("one") + "Tests 2 passed (2)", true).passed, false);
  assert.equal(
    storyReport(record("one") + record("one") + "Tests 2 passed (2)", true).passed,
    false,
  );
  assert.equal(storyReport("Tests 0 passed (0)", true).passed, false);
  assert.equal(storyReport(log + "\nCONTRAST_STORY_EVIDENCE broken", true).passed, false);
});

Deno.test("violations and unresolved text/non-text failures propagate independently", () => {
  for (const kind of ["violations", "incomplete", "nonText"]) {
    const failing = evidence();
    if (kind === "violations") failing.violations.push({ id: "color-contrast" });
    if (kind === "incomplete") failing.contrast.unresolved.push({ message: "gradient" });
    if (kind === "nonText") failing.nonText.failures.push({ ratio: 1.2 });
    assert.equal(storyReport(record("one", failing) + "Tests 1 passed (1)", true).passed, false);
  }
});
