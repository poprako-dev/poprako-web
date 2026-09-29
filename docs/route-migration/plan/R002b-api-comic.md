# R002b · Comic and workset API

**Owner:** detail worker. **Dependencies:** R002. **Status:** done.

**Interface:** comic, chapter, page, assignment, and workset contracts plus
request adapters; raw payload conversion is centralized at the request boundary.

**Work:** migrate CRUD, page lists, assignments, workflow records,
imports/exports, and workset request behavior without changing server contract
or caller-visible error metadata. Keep route presentation/controller behavior
for R004.

**Deletion:** old comic/chapter/page/assignment/workset request, raw type, and
casing modules after consumer migration; no compatibility re-export layer.

**Tests/evidence:** request path/body/response tests, import/export edge cases,
workflow event mappings, workset relations, and API-to-domain roundtrips;
confirm no manual field-by-field case conversion remains.

Final evidence: [implementation results](../review/implementation-results.md).
