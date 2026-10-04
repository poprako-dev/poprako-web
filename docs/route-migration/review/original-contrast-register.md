# Original-color contrast register

> Historical migration evidence. On 2026-10-04 the user approved correcting
> contrast while retaining the light visual direction. The runtime debt matcher
> and its baseline have been removed. The current strict gate is documented in
> [the README](../../../README.md#配色与对比度); the measurements below describe
> the earlier restoration, not current acceptance.

The user explicitly chose on 2026-09-29: preserve the original colors and
register existing contrast issues separately. The visual reference is `68cedc0`.
This does not authorize a global accessibility exemption or a palette redesign.

## Enforcement

The Storybook browser runner still executes the complete axe audit and all
interaction assertions. Its full accessibility report remains available.
`script/contrast-baseline.ts` classifies only the exact `color-contrast` entries
recorded in `.storybook/contrast-baseline.json` as known debt. Each entry binds
the story ID, element selector, foreground/background colors, measured ratio,
font size/weight, required ratio, and maximum occurrence count.

Other rules, new stories, new elements, changed color or font measurements,
additional occurrences, malformed results, and a missing audit all fail.
Resolved entries may disappear without failing. Generated Radix IDs are
normalized; element classes and positions remain part of the selector.
There is no automatic baseline-update mode in the test runner.

## Fixture stability

Workflow story timestamps are fixed so selectors do not change with wall-clock
time. The terminology translator story waits for its page image to load before
the audit; this exposes the original white-on-amber marker consistently.
Production colors, layout, and interaction behavior are unchanged by these
test-fixture corrections.

## Evidence

The initial exact comparison passed 180 of 183 browser cases and rejected three
unregistered results. Two used moving timestamps; one was an image-dependent
marker. These failures establish that the browser hook rejects mismatches
rather than merely recording every new failure as acceptable.

The matcher regression tests cover new rules/stories, changed colors/selectors,
excess duplicate counts, malformed/nested check data, known entries, and resolved
entries.

`deno task check` passed on 2026-09-29 at 00:14:33: format, full typecheck,
lint, structure, route generation, 287 unit tests, 23 integration tests,
183 Storybook cases, and 39 script tests. An independent browser rerun also
passed all 183 cases. That snapshot contained 945 measured elements across 129
stories. Subsequent restoration of original story backgrounds requires a fresh
full check; the earlier successful snapshot is not evidence for the current tree. These remain accessibility debt; passing the regression gate does not
mean the original palette meets contrast guidelines.

All 244 shared Tailwind color values in the cached original 4.3.3 theme and
current 4.1.18 theme are equivalent. Twelve achromatic declarations use different
percentage/zero-hue notation, with no change in color. Application-specific
colors and opacity remain governed by the `68cedc0` source reference.

Current verification: 2026-09-29 09:19:13 Asia/Shanghai. The complete
`deno task check` passed (exit 0): format, all typechecks, lint, structure,
route generation, 287 unit, 23 integration, 183 Storybook, and 39 script tests.
The restored register contains 981 exact entries across 129 stories, including
the original story backgrounds and the complete visible statistic rows.
Production colors were not changed to satisfy the contrast checks.
