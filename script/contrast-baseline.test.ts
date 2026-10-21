import assert from "node:assert/strict";
import { test } from "vitest";
import { stories as designExceptions } from "../.storybook/contrast-exceptions.json";
import {
  type AccessibilityViolation,
  compareContrastBaseline,
  contrastEntries,
  type ContrastEntry,
} from "./contrast-baseline.ts";

function violation(
  target: unknown,
  options: {
    id?: string;
    checkId?: string;
    fgColor?: string;
    bgColor?: string;
    data?: Record<string, unknown>;
    all?: unknown[];
    none?: unknown[];
  } = {},
): AccessibilityViolation {
  return {
    id: options.id ?? "color-contrast",
    nodes: [
      {
        target,
        any: [
          {
            id: options.checkId ?? "color-contrast",
            data: {
              fgColor: options.fgColor ?? "#777777",
              bgColor: options.bgColor ?? "#ffffff",
              contrastRatio: 4.48,
              fontSize: "12pt (16px)",
              fontWeight: "normal",
              expectedContrastRatio: "4.5:1",
              element: "ignored-coordinate-sensitive-data",
              ...options.data,
            },
          },
        ],
        ...(options.all ? { all: options.all } : {}),
        ...(options.none ? { none: options.none } : {}),
      },
    ],
  };
}

test("contrast entries include only valid color-contrast check fields and group counts", () => {
  const entries = contrastEntries([
    violation(["#radix-a", ".label"]),
    violation(["#radix-b", ".label"]),
    {
      id: "aria-label",
      nodes: [{ target: ["#c"], any: [{ id: "x", data: {} }] }],
    },
    { id: "color-contrast", nodes: [{ target: ["#d"], any: [] }] },
    {
      id: "color-contrast",
      nodes: [{ target: ["#e"], any: [{ id: "x", data: {} }] }],
    },
  ]);
  assert.deepEqual(entries, [
    {
      target: '["#radix-generated",".label"]',
      checks: JSON.stringify([
        {
          id: "color-contrast",
          data: {
            fgColor: "#777777",
            bgColor: "#ffffff",
            contrastRatio: 4.48,
            fontSize: "12pt (16px)",
            fontWeight: "normal",
            expectedContrastRatio: "4.5:1",
          },
        },
      ]),
      count: 2,
    },
  ]);
});

function oneEntry(violations: AccessibilityViolation[]): ContrastEntry {
  const entry = contrastEntries(violations)[0];
  if (!entry) throw new Error("Expected a contrast baseline entry");
  return entry;
}

test("new rule and new story are unexpected, even when contrast has no baseline", () => {
  const baseline = { known: [oneEntry([violation([".label"])])] };
  const result = compareContrastBaseline("new-story", [violation([".label"])], baseline);
  assert.equal(result.known, 0);
  assert.equal(result.unexpected.length, 1);
  const nonContrast = compareContrastBaseline(
    "known",
    [
      {
        id: "aria-label",
        nodes: [{ target: [".label"], any: [{ id: "x", data: {} }] }],
      },
    ],
    baseline,
  );
  assert.equal(nonContrast.known, 0);
  assert.equal(nonContrast.unexpected.length, 1);
});

test("malformed contrast data and nested rules are never registered", () => {
  assert.deepEqual(
    contrastEntries([
      violation([".bad-color"], { fgColor: "red" }),
      violation([".bad-ratio"], {
        data: { contrastRatio: Number.POSITIVE_INFINITY },
      }),
      violation([".nested-rule"], { checkId: "aria-label" }),
      violation([".nested-all"], { all: [{ id: "aria-allowed-attr" }] }),
      violation([".nested-none"], { none: [{ id: "aria-hidden-focus" }] }),
    ]),
    [],
  );
  const result = compareContrastBaseline(
    "story",
    [
      violation([".nested-rule"], { checkId: "aria-label" }),
      violation([".nested-all"], { all: [{ id: "aria-allowed-attr" }] }),
    ],
    {},
  );
  assert.equal(result.known, 0);
  assert.equal(result.unexpected.length, 2);
});

test("worse color values and new targets do not match a baseline entry", () => {
  const baseline = { story: contrastEntries([violation([".label"])]) };
  assert.equal(
    compareContrastBaseline("story", [violation([".label"], { fgColor: "#666666" })], baseline)
      .known,
    0,
  );
  assert.equal(compareContrastBaseline("story", [violation([".other"])], baseline).known, 0);
});

test("known violations consume baseline count and duplicate overflow fails", () => {
  const baseline = {
    story: [{ ...oneEntry([violation([".label"])]), count: 1 }],
  };
  const one = compareContrastBaseline("story", [violation([".label"])], baseline);
  assert.deepEqual(one, { known: 1, unexpected: [] });
  const two = compareContrastBaseline(
    "story",
    [violation([".label"]), violation([".label"])],
    baseline,
  );
  assert.equal(two.known, 1);
  assert.equal(two.unexpected.length, 1);
});

test("removed baseline issues do not fail", () => {
  const result = compareContrastBaseline("story", [], {
    story: [{ target: '[".label"]', checks: "[]", count: 1 }],
  });
  assert.deepEqual(result, { known: 0, unexpected: [] });
});

function annotationViolation(field: string, generatedId = "r8"): AccessibilityViolation {
  return violation([`#unit-comment-«${generatedId}»-${field}-label`], {
    fgColor: "#808690",
    bgColor: "#e8e7e5",
    data: { contrastRatio: 2.96, fontSize: "9.0pt (12px)" },
  });
}

test("approved comment labels match across generated React IDs only in registered stories", () => {
  for (const story of Object.keys(designExceptions)) {
    assert.deepEqual(
      compareContrastBaseline(
        story,
        [
          annotationViolation("translationComment", "r1"),
          annotationViolation("supplementComment", "r99"),
        ],
        designExceptions,
      ),
      { known: 2, unexpected: [] },
    );
  }
  const result = compareContrastBaseline(
    "unregistered-story",
    [annotationViolation("translationComment")],
    designExceptions,
  );
  assert.equal(result.known, 0);
  assert.equal(result.unexpected.length, 1);
});

test("comment exception rejects changed colors, extra labels and non-contrast rules", () => {
  const changedColor = annotationViolation("translationComment");
  const check = changedColor.nodes[0]?.any[0];
  if (!check) throw new Error("Expected contrast check");
  check.data = { ...(check.data as Record<string, unknown>), fgColor: "#999999" };
  const result = compareContrastBaseline(
    "features-unitannotations--proofread",
    [
      annotationViolation("translationComment"),
      annotationViolation("supplementComment"),
      annotationViolation("translationComment", "r99"),
      annotationViolation("otherField"),
      changedColor,
      violation(["#unit-comment-«r8»-translationComment-label"], { id: "aria-label" }),
    ],
    designExceptions,
  );
  assert.equal(result.known, 2);
  assert.equal(result.unexpected.length, 4);
});
