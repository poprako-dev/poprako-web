# R004 · Comic controllers and uploads

**Owner:** detail worker. **Dependencies:** R003 and R007. **Status:** locally verified.

**Interface:** comic-detail controller shared by workspace/playground, with
route-specific navigation callbacks; upload runtime owns long-lived tasks and
observes session invalidation.

**Work:** migrate detail, workspace and playground controllers,
chapters/pages/assignments/workflow, import/export and uploads. Preserve query
navigation, permission distinctions and upload continuity across route unmount.

**Deletion:** old ComicPlayground/Workspace feature trees and duplicate
detail/controller implementations. No route-to-sibling imports.

**Tests/evidence:** real route integration for open/change/close/return; detail
story interactions; upload progress/retry/cancel/session invalidation and
stale-response tests; source ownership check.

Final evidence: [implementation results](../review/implementation-results.md).
