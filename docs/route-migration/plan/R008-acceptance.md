# R008 · Integration acceptance

**Owner:** root integration. **Dependencies:** R004–R007. **Status:** locally verified.

**Interface:** final source tree must satisfy `docs/REQUIREMENTS.md`; generated
route tree, checks and deploy workflow describe the same application.

**Work:** integrate workers, preserve untracked test resources, review deletions
and user-facing behavior, and record unresolved limits accurately. No commit or
deployment is implied.

**Deletion:** remaining old source hierarchy, compatibility exports, dark/system
theme remnants, obsolete documentation and generated artifacts not belonging in
source.

**Tests/evidence:** frozen install, format, all TypeScript projects, lint,
structure/dependency fixtures, generator check, unit/integration/Storybook
browser suites, production and Storybook builds, deployment/static-server
regression and CI platform matrix. Record exact exit status and logs; only then
mark this plan done.

Final evidence: [implementation results](../review/implementation-results.md).
