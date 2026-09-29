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

Follow-up correction restored four remaining differences:

- Reset-password hover uses the original amber background, ring, and text.
- Export-log hover uses the original stone background, ring, and text.
- Online-count text retains the original text-node boundaries and width.
- Mobile navigation retains the original build-time translucent color mix:
  `oklab(89.7767% .00326395 .0344419 / .95)`.

Validation on 2026-09-28 used DOM computed styles and geometry; no screenshots
were used for comparison. The comparison found zero differences across 202 palette
values, 30 settings-button states, and 28 desktop/mobile scene cases. The reference
uses source from `68cedc0` with the currently installed rendering dependencies.
These results cover the tested scenes, not every interaction or a populated
translator canvas, and do not establish universal pixel equivalence.

The production build, application type check, changed-component lint, structure,
and test-inventory checks passed. The final navigation token was moved into
`:root` to satisfy the existing semantic-token check; the generated CSS retained
the exact color value above. Previously recorded Storybook contrast failures
remain unresolved; no colors were redesigned or checks disabled to hide them.

The 23:49–23:59 correction window additionally restored original story wrapper
colors in UnitList, UnitFlags, MemberInvitorModal, MemberInvitorModalSlowNetwork,
and WorkflowRecordList. Production translator canvas, marker, sidebar, and list
styles were checked against the original source without finding another
confirmed difference. Mutation response decoders were checked against the
backend handlers without finding another contract mismatch.

Storybook's automatic failure artifacts polluted source directories even with
the root CLI screenshot flag. The project browser configuration now disables
automatic failure screenshots, and the generated directories were moved outside
the repository. No screenshot was inspected and no assertion was disabled.

Final aggregate at 23:57:51: format, full typecheck, lint, structure, route
generation, 287 unit tests, and 23 integration tests passed. Storybook remains
54 passed / 129 contrast failures; the acceptance gate is not passed. The 33
script tests passed separately. The concurrent CR agent owns the HTTP transport
changes and its two added regression cases; this appearance correction did not
modify those files.

On 2026-09-29 the user explicitly requested preserving original colors and
registering original contrast problems separately. The resulting exact-element
regression gate passed the full `deno task check`, including all 183 Storybook
cases; a second browser run also passed. See the
[original contrast register](original-contrast-register.md) for the known debt,
its enforcement, and final test counts. No production color was changed to
achieve that result.
