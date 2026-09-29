# R007 · Shared interfaces and light appearance

**Owner:** shared worker. **Dependencies:** R001. **Status:** done.

**Interface:** route-independent components/hooks/utilities in `src/shared`;
light-only token system. Zustand and Storybook remain. API casing uses R002
converters, not another shared manual map.

**Work:** tighten shared component props and callable contracts, remove
unnecessary nullability/fallbacks, align semantic colors to the single light
palette, and preserve toast/dialog/keyboard behavior.

**Deletion:** dark/system preference values, persistence, system listeners,
theme selector, dark CSS variants and obsolete theme tests. Do not remove or
rewrite unrelated visual behavior.

**Tests/evidence:** shared component unit tests and a11y stories, type/lint
checks, contrast/accessibility browser tests, search proving theme machinery was
removed and no business imports enter shared.

Final evidence: [implementation results](../review/implementation-results.md).
