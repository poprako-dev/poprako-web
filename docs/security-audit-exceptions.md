# Security Audit Exceptions

例外必须精确到 GitHub advisory ID，说明不可达路径、上游状态和复核条件。禁止
使用全局 `--ignore-unfixable`。

当前没有生效中的安全审计例外。CI 使用 `pnpm audit --audit-level high`，
发现 high 或 critical advisory 时必须修复依赖或补充经过审查的例外说明。
