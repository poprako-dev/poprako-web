# Security Audit Exceptions

例外必须精确到 GitHub advisory ID，说明不可达路径、上游状态和复核条件。禁止
使用全局 `--ignore-unfixable`。

## GHSA-qwww-vcr4-c8h2

- Scope: React Router RSC Mode action execution before a rejected request.
- Current dependency: `react-router-dom@7.18.2`.
- Reason: 本项目是 Vite 静态 SPA，只使用浏览器端 router，不启用 React Router
  Framework/RSC Mode，也不提供 server action endpoint，因此漏洞路径不可达。
- Upstream state: 2026-08-03 的 registry 稳定最新版为 7.18.2；advisory 标记的
  patched version 是尚无稳定发布的 8.3.0。
- Control: CI 只忽略此 advisory，其他 high/critical production advisory 仍失败。
- Config: 精确 ID 保存在 `pnpm-workspace.yaml` 的 `auditConfig.ignoreGhsas`。
- Review: React Router 发布可兼容的修复版本、项目引入 SSR/RSC，或 2026-09-03，
  以最早发生者为准。
