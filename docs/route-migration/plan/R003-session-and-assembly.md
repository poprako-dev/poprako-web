# R003 · Session and application assembly

**Owner:** session worker. **Dependencies:** R002a–R002d. **Status:**
done.

**Interface:** `Main`/application router assembly and ready-auth/team session
contract. Session uses identity API; shell and translator receive explicit ready
state. Zustand remains the cross-route session authority.

**Work:** preserve persisted session keys, concurrent restore behavior,
selected-team fallback, invalidation/race handling, authenticated routing, and
login/logout navigation. Keep route assembly free of domain logic.

**Deletion:** old router/store/auth guard and duplicate session providers after
route callers move; retain no old router compatibility layer.

**Tests/evidence:** memory-router entry/redirect/history tests; restore
concurrency, failure, team fallback, identity switch and late-response tests;
verify old storage format remains readable.

Final evidence: [implementation results](../review/implementation-results.md).
