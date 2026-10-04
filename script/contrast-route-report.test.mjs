import assert from "node:assert/strict";
import { routeReport } from "./contrast-route-report.mjs";

function cleanReport() {
  return {
    passed: true,
    setupErrors: /** @type {unknown[]} */ ([]),
    reports: [
      {
        violations: /** @type {unknown[]} */ ([]),
        contrast: { unresolved: /** @type {unknown[]} */ ([]) },
        nonText: { failures: /** @type {unknown[]} */ ([]) },
      },
    ],
    colors: [{ passed: true }],
    imageLabels: { labels: [{ ratio: 4.6 }, { ratio: 21 }] },
  };
}

Deno.test("route gate refuses false success, missing evidence, and renderer setup errors", () => {
  assert.equal(routeReport(cleanReport(), true).passed, true);
  assert.equal(routeReport(cleanReport(), false).passed, false);
  assert.equal(routeReport({}, true).passed, false);
  const report = cleanReport();
  report.setupErrors.push("A route never loaded");
  assert.equal(routeReport(report, true).passed, false);
  report.setupErrors = [];
  report.reports[0].nonText.failures.push({ ratio: 1.2 });
  assert.equal(routeReport(report, true).passed, false);
});

Deno.test("route gate checks color pairs and both image endpoints", () => {
  const report = cleanReport();
  report.colors[0].passed = false;
  assert.equal(routeReport(report, true).passed, false);
  report.colors[0].passed = true;
  report.imageLabels.labels.pop();
  assert.equal(routeReport(report, true).passed, false);
  report.imageLabels.labels.push({ ratio: 2 });
  assert.equal(routeReport(report, true).passed, false);
});
