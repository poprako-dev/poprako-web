import assert from "node:assert/strict";
import { test } from "vitest";
import { stories as designExceptions } from "../.storybook/contrast-exceptions.json";
import {
  type AccessibilityViolation,
  compareContrastBaseline,
  contrastEntries,
  pruneContrastBaseline,
  parseContrastObservation,
  type ContrastEntry,
  type ContrastObservation,
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

test("pruning requires observations and preserves skipped or unobserved stories", () => {
  const entries = contrastEntries([violation([".label"])]);
  const baseline = { fixed: entries, skipped: entries };
  assert.throws(() => pruneContrastBaseline(baseline, [], {}), /No completed/);
  assert.deepEqual(
    pruneContrastBaseline(
      baseline,
      [{ storyId: "fixed", violations: [], incompleteRules: [] }],
      {},
    ),
    {
      skipped: entries,
    },
  );
  assert.deepEqual(baseline, { fixed: entries, skipped: entries });
});

test("pruning shrinks exact counts without adding design exceptions to history", () => {
  const observed = violation([".label"]);
  const entries = contrastEntries([observed, observed]);
  const exception = violation([".approved"]);
  const result = pruneContrastBaseline(
    { story: entries },
    [{ storyId: "story", violations: [observed, exception], incompleteRules: [] }],
    { story: contrastEntries([exception]) },
  );
  assert.deepEqual(result, { story: contrastEntries([observed]) });
});

test("inconclusive color-contrast audits cannot retire historical allowances", () => {
  const baseline = { story: contrastEntries([violation([".label"])]) };
  assert.deepEqual(
    pruneContrastBaseline(
      baseline,
      [
        {
          storyId: "story",
          violations: [],
          incompleteRules: ["color-contrast"],
        },
      ],
      {},
    ),
    baseline,
  );
});

test("pruning rejects new findings, changed fingerprints, overflow and duplicate audits", () => {
  const observed = violation([".label"]);
  const baseline = { story: contrastEntries([observed]) };
  for (const violations of [
    [violation([".new"])],
    [violation([".label"], { fgColor: "#666666" })],
    [observed, observed],
    [violation([".label"], { id: "aria-label" })],
  ]) {
    assert.throws(() =>
      pruneContrastBaseline(baseline, [{ storyId: "story", violations, incompleteRules: [] }], {}),
    );
  }
  assert.throws(
    () =>
      pruneContrastBaseline(
        baseline,
        [
          { storyId: "story", violations: [], incompleteRules: [] },
          { storyId: "story", violations: [observed], incompleteRules: [] },
        ],
        {},
      ),
    /Duplicate/,
  );
});

test("capture parsing requires explicit audit completeness before pruning", () => {
  for (const value of [
    null,
    {},
    { storyId: "story", violations: [] },
    { storyId: "", violations: [], incompleteRules: [] },
    { storyId: "story", violations: [], incompleteRules: null },
    {
      storyId: "story",
      violations: [],
      incompleteRules: [null],
    },
  ]) {
    assert.throws(() => parseContrastObservation(JSON.stringify(value)), /Incomplete/);
    assert.throws(
      () => pruneContrastBaseline({}, [value as ContrastObservation], {}),
      /Incomplete/,
    );
  }
  const complete = { storyId: "story", violations: [], incompleteRules: [] };
  assert.deepEqual(parseContrastObservation(JSON.stringify(complete)), complete);
});

function annotationViolation(
  field: string,
  generatedId = "r8",
  focused = true,
): AccessibilityViolation {
  return violation([`#unit-note-«${generatedId}»-${field}-label`], {
    fgColor: focused ? "#808690" : "#848a94",
    bgColor: focused ? "#e8e7e5" : "#fafaf9",
    data: { contrastRatio: focused ? 2.96 : 3.32, fontSize: "9.0pt (12px)" },
  });
}

test("approved note labels match across generated React IDs only in registered stories", () => {
  for (const story of Object.keys(designExceptions)) {
    const focused = story !== "features-unitannotations--read-only";
    assert.deepEqual(
      compareContrastBaseline(
        story,
        [
          annotationViolation("typographyNote", "r1", focused),
          annotationViolation("translationNote", "r99", focused),
        ],
        designExceptions,
      ),
      { known: 2, unexpected: [] },
    );
  }
  const result = compareContrastBaseline(
    "unregistered-story",
    [annotationViolation("typographyNote")],
    designExceptions,
  );
  assert.equal(result.known, 0);
  assert.equal(result.unexpected.length, 1);
});

test("note exception rejects changed colors, extra labels and non-contrast rules", () => {
  const changedColor = annotationViolation("typographyNote");
  const check = changedColor.nodes[0]?.any[0];
  if (!check) throw new Error("Expected contrast check");
  check.data = { ...(check.data as Record<string, unknown>), fgColor: "#999999" };
  const result = compareContrastBaseline(
    "features-unitannotations--proofread",
    [
      annotationViolation("typographyNote"),
      annotationViolation("translationNote"),
      annotationViolation("typographyNote", "r99"),
      annotationViolation("otherField"),
      changedColor,
      violation(["#unit-note-«r8»-typographyNote-label"], { id: "aria-label" }),
    ],
    designExceptions,
  );
  assert.equal(result.known, 2);
  assert.equal(result.unexpected.length, 4);
});
