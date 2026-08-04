# Changelog

所有生产可见变更记录在此。项目遵循 Semantic Versioning，并按 Added、Changed、
Fixed、Security 和 Removed 分类。

## Unreleased

- Added organization-transfer CI/CD, immutable frontend releases, atomic
  deployment, rollback, retention, and post-deployment verification.
- Changed repository documentation and tooling to use the `poprako-web`
  organization identity and one canonical pnpm check path.
- Changed production deployment documentation to match the containerized nginx,
  webroot certificate renewal, and the existing `deploy` account.
- Changed repository governance to accept pull requests directly into protected
  `main`, with no long-lived development branch.
- Removed obsolete prototypes, completed plans, duplicate API snapshots,
  personal agent hooks, superseded repository skills, migration checklists,
  placeholder assets, and duplicate deployment examples.
- Security upgraded React Router to 7.18.2, resolving the production advisories
  that have a stable patched release.
