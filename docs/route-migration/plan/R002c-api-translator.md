# R002c · Translator API

**Owner:** translator worker. **Dependencies:** R002. **Status:** done.

**Interface:** translator unit, search/transform, terminology and termbase API
contracts. Translator behavior consumes domain-shaped payloads; case conversion
remains at the API boundary.

**Work:** migrate page/unit data, edits and search/transform requests,
terminology lookup and termbase operations while preserving save IDs, patch
semantics and response/error shapes.

**Deletion:** old translator request/type/raw modules and duplicate field casing
maps after direct callers migrate.

**Tests/evidence:** nested payload converter tests, save/create/patch/delete
mapping, search/transform and termbase request tests, abort/stale response
checks, translator typecheck and import scan.

Final evidence: [implementation results](../review/implementation-results.md).
