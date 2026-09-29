# Original light appearance contract

The visual reference is commit `68cedc0`, before either architecture migration
commit. `0fd3646` already changed colors and is not a valid visual baseline.

Restore original colors, opacity, typography, spacing, dimensions, borders,
shadows, and hover/selected/disabled states across all routes and shared UI.
Semantic color names must preserve each original rendered value; distinct
original colors must not be collapsed into one approximate palette. Restore
the beige navigation shell, brown navigation text, original brand greens,
white dialog overlays, and translator marker/diff/statistics colors.

Keep route ownership, independent API transport, current component contracts,
session fixes, and route splitting. Keep the app light-only. Do not restore
dark selectors, theme persistence, or theme settings. Preserve accessibility
semantics and keyboard behavior. Report any original contrast failures rather
than silently redesigning colors to satisfy an accessibility check.

Acceptance compares fixed-data original/current renders in the same Chromium
and fonts, at desktop and mobile sizes, including interaction states. Source
mapping and computed-color assertions supplement screenshots; passing generic
functional tests alone is not evidence of visual preservation.
