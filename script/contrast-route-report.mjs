/** Require both a successful process and complete, clean route evidence.
 * @param {{passed?: boolean, reports?: {violations: unknown[], contrast: {unresolved: unknown[]}, nonText: {failures: unknown[]}}[], setupErrors?: unknown[], fatal?: string, colors?: {passed: boolean}[], imageLabels?: {labels?: {ratio: number}[]}}} report
 * @param {boolean} success
 */
export function routeReport(report, success) {
  const errors = [];
  if (!success) errors.push("Route process failed");
  if (report.passed !== true || report.fatal) errors.push("Route report failed");
  if (!Array.isArray(report.setupErrors) || report.setupErrors.length)
    errors.push("Route setup failed");
  if (!Array.isArray(report.reports) || !report.reports.length) errors.push("Missing route states");
  else
    for (const state of report.reports) {
      if (
        !Array.isArray(state.violations) ||
        state.violations.length ||
        !Array.isArray(state.contrast?.unresolved) ||
        state.contrast.unresolved.length ||
        !Array.isArray(state.nonText?.failures) ||
        state.nonText.failures.length
      )
        errors.push("Failed or incomplete route state");
    }
  if (!report.colors?.length || report.colors.some((color) => color.passed !== true))
    errors.push("Missing or failing color pairs");
  if (
    report.imageLabels?.labels?.length !== 2 ||
    report.imageLabels.labels.some((label) => label.ratio < 4.5)
  )
    errors.push("Missing or failing image endpoints");
  return { passed: errors.length === 0, errors };
}
