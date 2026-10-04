import { afterEach as runAccessibilityAudit } from "@storybook/addon-a11y/preview";
import type { AxeResults } from "axe-core";
import {
  auditNonText,
  resolveIncompleteContrast,
  settleContrastState,
} from "../script/contrast-dom.mjs";
import { emitStoryEvidence } from "../script/contrast-evidence.mjs";

type StoryContext = Parameters<typeof runAccessibilityAudit>[0];

export async function checkStoryAccessibility(context: StoryContext): Promise<void> {
  await settleContrastState();
  const configured: unknown = context.parameters["a11y"];
  const a11y = typeof configured === "object" && configured !== null ? configured : {};
  let axeFailure: unknown;
  try {
    await runAccessibilityAudit({
      ...context,
      parameters: { ...context.parameters, a11y: { ...a11y, test: "error" } },
    });
  } catch (error) {
    axeFailure = error;
  }
  const report = context.reporting.reports
    .filter((entry) => {
      const value: unknown = entry.result;
      return (
        entry.type === "a11y" &&
        typeof value === "object" &&
        value !== null &&
        "violations" in value
      );
    })
    .at(-1);
  const result: unknown = report?.result;
  if (
    typeof result !== "object" ||
    result === null ||
    !("violations" in result) ||
    !Array.isArray(result.violations)
  ) {
    console.error(
      "CONTRAST_AUDIT_ERROR " +
        JSON.stringify({ storyId: context.id, error: String(axeFailure), report }),
    );
    throw new Error(
      `Accessibility audit produced no result for ${context.id}: ${String(axeFailure)}`,
    );
  }
  const contrast = resolveIncompleteContrast(result as AxeResults);
  const nonText = auditNonText();
  emitStoryEvidence(context.id, { violations: result.violations, contrast, nonText });
  if (
    axeFailure ||
    result.violations.length ||
    contrast.unresolved.length ||
    nonText.failures.length
  ) {
    console.error(
      "CONTRAST_FINAL_STATE " +
        JSON.stringify({ storyId: context.id, violations: result.violations, contrast, nonText }),
    );
    throw new Error(`Accessibility failed for ${context.id}; see CONTRAST_FINAL_STATE evidence`);
  }
}
