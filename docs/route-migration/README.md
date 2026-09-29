# PopRaKo Web route migration

This folder records implementation requirements, work packages, inventories, and
evidence for the Web refactor. Current policy is
[../REQUIREMENTS.md](../REQUIREMENTS.md); implementation order is
[plan/README.md](plan/README.md). The current plan series is R001–R008,
including API subplans R002a–R002d.

The older S/P documents are historical planning material. Where they conflict
with current requirements, the latter govern. In particular, this migration uses
singular `route`, `utility`, `setting`, and `test-resource` directories;
preserves an independent `src/api` boundary; adopts shared case conversion; and
is light-only. Earlier three-state theme and plural `routes` details are
superseded.

## Current status

R001–R007 are implemented and R008 local acceptance passed. See [final results](review/implementation-results.md) for commands, counts and verification limits, and [component contracts](review/component-contract-review.md) for the complete component review index. No commit or remote deployment was performed.

## Archive map

- `spec/` contains detailed S-series design notes, retained for traceability;
  they are not current requirements where conflicts are marked above.
- `plan/P*.md` contains the previous work plan; it is historical and superseded
  by the R-series.
- `migration/` contains the original source inventory. Update mappings as the
  physical rename proceeds; do not treat the old inventory as proof that the new
  source tree is complete.
- `review/` contains prior review evidence. Re-run checks against the current
  tree before citing results as current.
