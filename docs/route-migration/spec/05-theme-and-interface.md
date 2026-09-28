# S05 · Light appearance and interaction

Status: historical detailed design. Current product requirements in
[docs/REQUIREMENTS.md](../../REQUIREMENTS.md) supersede any earlier
theme-selector decisions. This Web app is light-only.

## Appearance contract

- Keep one light token palette in application styles. Reuse semantic surface,
  text, border, primary, destructive, sidebar, progress, and diff tokens.
- Remove dark-mode CSS variants, root `dark` class management,
  `prefers-color-scheme` listeners, `color-scheme` switching, theme-provider
  state, the `poprako:theme` storage key, and theme selection UI.
- Do not add a second palette or introduce dark/system modes through settings or
  stories. Existing explicit colors are converted to semantic light tokens where
  they bypass the shared palette.
- Preserve the existing visual hierarchy, spacing, information order, and muted
  style. Image pixels and exported content are not recolored.

## Interaction contract

- Preserve keyboard navigation, clear focus, accessible names, Radix dialog
  focus behavior, IME handling, and existing shortcut semantics.
- Search, terminology and settings inputs must not trigger unrelated global
  translator shortcuts. Preserve composition and legacy keyCode 229 handling
  where already required.
- Loading, empty, failure, retry and success remain distinct states. Keep
  recovery actions safe and preserve user input on failure.
- Storybook a11y and interaction checks remain active. Fix violations at their
  component or fixture source; do not suppress full rules or globally mark
  accessibility checks todo.
- Retain the existing translator layout, image geometry, editor behavior and
  responsive scrolling during directory moves.

## Evidence

R007 covers shared interface and palette work; R008 verifies the final light
interface, accessibility, keyboard interaction and absence of theme preference
machinery. This historical S-series document does not claim implementation or
test completion.
