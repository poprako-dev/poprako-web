import { afterEach as runAccessibilityAudit } from "@storybook/addon-a11y/preview";
import { compareContrastBaseline, type AccessibilityViolation } from "../script/contrast-baseline";
import { stories as contrastBaseline } from "./contrast-baseline.json";

type StoryContext = Parameters<typeof runAccessibilityAudit>[0];

export async function checkStoryAccessibility(context: StoryContext): Promise<void> {
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => {
      resolve();
    }),
  );
  // Audit the settled state of finite dialog/popover transitions. Do not wait
  // for infinite loading indicators, or alter production animation styles.
  for (const animation of document.getAnimations()) {
    const endTime = animation.effect?.getComputedTiming().endTime;
    if (
      animation.playState === "running" &&
      animation.playbackRate !== 0 &&
      typeof endTime === "number" &&
      Number.isFinite(endTime)
    )
      animation.finish();
  }
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => {
      resolve();
    }),
  );
  const configured: unknown = context.parameters["a11y"];
  const a11y = typeof configured === "object" && configured !== null ? configured : {};
  // Keep the full axe report visible. Enforce exact registered exceptions below,
  // instead of making every violation fatal before it can be classified.
  await runAccessibilityAudit({
    ...context,
    parameters: {
      ...context.parameters,
      a11y: { ...a11y, test: "todo" },
    },
  });
  const report = context.reporting.reports.filter((entry) => entry.type === "a11y").at(-1);
  const result: unknown = report?.result;
  if (
    typeof result !== "object" ||
    result === null ||
    !("violations" in result) ||
    !Array.isArray(result.violations)
  ) {
    throw new Error(`Accessibility audit produced no result for ${context.id}`);
  }
  const comparison = compareContrastBaseline(
    context.id,
    result.violations as AccessibilityViolation[],
    contrastBaseline,
  );
  if (comparison.unexpected.length > 0) {
    console.error(
      "CONTRAST_FINAL_STATE " +
        JSON.stringify({ storyId: context.id, violations: result.violations }),
    );
    throw new Error(comparison.unexpected.join("\n"));
  }
}
