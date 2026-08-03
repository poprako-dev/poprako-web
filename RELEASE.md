# Release Policy

`main` 是生产分支。每次合入 `main` 都会先通过必需 CI，再经 GitHub Actions
`production` 环境批准，部署以完整 commit SHA 命名的静态站点。该 SHA 是部署、
审计和回滚的权威标识。

只有已成功部署的 `main` commit 才能创建 `vMAJOR.MINOR.PATCH` 标签和 GitHub
Release。补丁版本包含兼容修复，次版本增加兼容能力，主版本可以改变公开行为。

Release 产物必须由 GitHub Actions 构建，不能从维护者机器上传。每个 Release
包含静态站点压缩包、构建使用的 pnpm lockfile、构建来源信息和 SHA-256 校验
文件。首次组织所有的生产发布前，应在受保护的 staging 环境演练部署与回滚。
