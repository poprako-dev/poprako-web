# Appearance restoration evidence

Status: in-progress. Visual reference: `68cedc0`.

Initial source comparison found changed visual utility literals in 109 of 130
directly mapped production TSX files. This is a source-difference count, not
a rendered-regression count, and includes component extraction effects.

Confirmed regressions include navigation background `#E8DCC4` replaced with
`#f7f8f6`, navigation text `#3D3028` replaced with the general foreground,
login brand `#88b04b` replaced with primary emerald, white translucent modal
overlays replaced with dark overlays, and translator marker/diff colors changed.
Eight sampled original light tokens also differed in the deterministic source
comparison. That comparison failed before restoration, as expected.

Browser comparisons and final check results will be recorded after execution.
