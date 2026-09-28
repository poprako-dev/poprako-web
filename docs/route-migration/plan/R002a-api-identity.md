# R002a · Identity API

**Owner:** session worker. **Dependencies:** R002. **Status:** done.

**Interface:** identity API contracts and request adapters for auth, user,
member, and team; consumers receive domain-cased values and structured failures.
Session owns credential persistence and restoration in R003, not transport.

**Work:** migrate sign-in/registration requests, identity lookups, member CRUD,
teams and roles; convert payloads through shared case utilities and preserve
existing API fields and URL contracts.

**Deletion:** old identity implementation under generic API/types/store folders
and duplicate manual casing maps once all consumers move.

**Tests/evidence:** auth success/failure, identity/member/team mappings,
malformed and null payloads, API request paths and token forwarding; consumer
import scan and typecheck.

Final evidence: [implementation results](../review/implementation-results.md).
