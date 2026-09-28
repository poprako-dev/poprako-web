# R005 · Leaf routes

**Owner:** leaf-route worker. **Dependencies:** R003 and R007. **Status:**
locally verified.

**Interface:** login/registration, mail, member management, and setting route
modules consume R003 session and R002 API contracts. Shared shell navigation is
injected through route assembly.

**Work:** migrate screen flows, loading/empty/error states, read/unread state
and settings behavior with current URL and API semantics.

**Deletion:** prior pages/features copies and obsolete top-level settings/store
modules after migration; do not retain default-export component shims.

**Tests/evidence:** route direct-entry/auth redirects, member and invitation
stories, message state tests, setting persistence tests and dark/system theme
absence checks.

Final evidence: [implementation results](../review/implementation-results.md).
