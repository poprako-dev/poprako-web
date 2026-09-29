# R001 · Requirements and structure

**Owner:** root integration (docs and directory gates). **Dependencies:** none.
**Status:** done.

**Interfaces:** `docs/REQUIREMENTS.md` is authoritative; root `src/api` is
independent of `src/route`; route imports obey ancestor ownership.
`test-resource` is the shared fixture root. Setting and utility are pathless
route groups below the authenticated route tree, not source roots.

**Work:** reconcile old requirements and decisions, rename source folders
without changing public URLs, retain the existing untracked test resources, and
establish positive/negative checks for naming and dependency direction. Remove
stale `features`/`pages`/plural-folder guidance and prior dark/system theme
requirements.

**Deletion:** old business classification trees and compatibility barrels are
removed as part of source moves; no aliases are kept solely for the old
structure.

**Tests/evidence:** requirement/spec review; tracked-file inventory and deletion
search; architecture-check positive and negative fixtures; Deno formatter,
typecheck and lint after source integration. Record exact commands and results
in execution ledger; do not infer completion from this plan.

Final evidence: [implementation results](../review/implementation-results.md).
