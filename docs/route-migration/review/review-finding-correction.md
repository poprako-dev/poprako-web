# Review finding corrections

Date: 2026-09-28. Scope: the two P2 findings and the P3 naming suggestion
reported for the four-commit `main...HEAD` review.

## Changes and reproduction

- Mail pagination previously merged the snapshot captured before awaiting the
  HTTP response. It now merges the latest store contents after the response,
  preserving successful concurrent `markRead` changes. The regression test
  holds pagination pending, marks an existing mail read, then returns a page
  containing that mail's stale unread version and a new mail. Both the returned
  result and store retain the read state; subsequent initial loading reuses it.
- The comic-detail story API now returns HTTP 204 with no body for assignment
  role updates, matching the production contract. A regression test uses the
  real API client, production detail actions, and the story fixture to verify
  sequential PUT/DELETE operations and final removal. The existing browser
  story's PUT/DELETE assertion remains in place.
- Restored 57 imported type names in 44 translator files, replacing numbered
  `TranslatorImportedType` aliases with their original semantic names. No such
  aliases remain under `src`.

Both P2 regression tests failed before their fixes and passed afterwards.

## Current validation

- Format, full typecheck, lint, structure/import boundaries, test discovery, and
  generated route consistency: passed.
- Unit: 285 passed. Integration: 23 passed. Script: 33 passed.
- `deno task check` reached Storybook, whose initial sandboxed run could not
  listen on localhost. Storybook was rerun with localhost permission; the
  script suite, skipped by the aggregate after failure, was run separately.
- Browser Storybook: 54 passed, 129 failed, 183 total. Every failing story
  reports `color-contrast`. The combined typeset/redraw removal story now
  completes its interaction assertions and fails at the accessibility audit,
  not at the PUT/DELETE assertion.
- Full acceptance gate: **not passed** because the original palette still
  produces accessibility failures. For example, the chapter number label in
  the combined-removal story reports contrast 2.07 against required 4.5.

No palette redesign, assertion removal, accessibility suppression, screenshot
inspection, real-account mutation, or commit was performed for this correction.
