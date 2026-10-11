import { afterEach as runAccessibilityAudit } from "@storybook/addon-a11y/preview";
import { compareContrastBaseline, type AccessibilityViolation } from "../script/contrast-baseline";
import { stories as contrastBaseline } from "./contrast-baseline.json";

type StoryContext = Parameters<typeof runAccessibilityAudit>[0];

export async function checkStoryAccessibility(context: StoryContext): Promise<void> {
  await waitForPaint();
  // Audit the settled state of finite dialog/popover transitions. Do not wait
  // for infinite loading indicators, or alter production animation styles.
  finishFiniteAnimations();
  await waitForPaint();
  await runSettledAccessibilityAudit(context);
  verifyAccessibilityReport(context);
}

function waitForPaint(): Promise<void> {
  return new Promise<void>((resolve) =>
    requestAnimationFrame(() => {
      resolve();
    }),
  );
}

function finishFiniteAnimations(): void {
  for (const animation of document.getAnimations()) {
    const endTime = animation.effect?.getComputedTiming().endTime;
    if (isFiniteRunningAnimation(animation, endTime)) animation.finish();
  }
}

function isFiniteRunningAnimation(animation: Animation, endTime: unknown): boolean {
  return (
    animation.playState === "running" &&
    animation.playbackRate !== 0 &&
    typeof endTime === "number" &&
    Number.isFinite(endTime)
  );
}

async function runSettledAccessibilityAudit(context: StoryContext): Promise<void> {
  const configured: unknown = context.parameters["a11y"];
  const a11y = typeof configured === "object" && configured !== null ? configured : {};
  // Keep axe findings visible so registered exceptions can be classified.
  await runAccessibilityAudit({
    ...context,
    parameters: { ...context.parameters, a11y: { ...a11y, test: "todo" } },
  });
}

function verifyAccessibilityReport(context: StoryContext): void {
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
