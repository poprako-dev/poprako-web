# Release Policy

`main` 是生产分支。每次合入 `main` 都会先通过必需 CI，再经 GitHub Actions
`production` 环境批准，部署以完整 commit SHA 命名的静态站点。该 SHA 是部署、
审计和回滚的权威标识。

只有已成功部署的 `main` commit 才能创建 `vMAJOR.MINOR.PATCH` 标签和 GitHub
Release。补丁版本包含兼容修复，次版本增加兼容能力，主版本可以改变公开行为。

每个版本的发行说明放在 `docs/release/MAJOR.MINOR.PATCH.md`，记录交付能力、
前后端兼容要求、部署配置和已知限制；`CHANGELOG.md` 保留对应版本的摘要。
准备期间标记为待发布，正式发布前核对版本、日期与交付范围。Release workflow
直接使用对应文件，不依赖 Git 历史自动生成首发说明。

本地集成、远端仓库重建与正式发布分别记录。维护者明确指定的任务例外只适用于
该次操作，不代表其他 SHA 已通过 CI 或生产部署，也不自动授权创建标签或发布。

Release 产物必须由 GitHub Actions 构建，不能从维护者机器上传。每个 Release
包含静态站点压缩包、构建使用的 pnpm lockfile、构建来源信息和 SHA-256 校验
文件。部署脚本的原子切换、幂等和失败回滚行为由仓库测试覆盖；生产发布仍须经过
`production` environment 的保护规则。

Release workflow 在构建前通过 GitHub Deployments API 检查本仓库完整 commit SHA 的
`production` deployment，要求其状态历史中存在同环境的 `success`。部署和状态列表
均读取全部分页；其他 SHA、其他环境、无成功记录、API 访问失败或响应异常都会阻止
发布。检查只读取部署记录，令牌仅增加 `deployments: read` 权限。

Release 的 `Run required checks` 步骤在实际生成 `dist/` 时注入
`VITE_API_BASE_URL=https://api.poprako.com/api/v1`，与生产部署构建一致；之后的
打包步骤直接使用该产物。`production` environment 的构建 secret 名为
`DEPLOY_API_BASE_URL`，映射到 Vite 构建变量 `VITE_API_BASE_URL`；Release 使用上述
固定公开地址，无需复制生产 secret 到 `release` environment。

GitHub 可能清理旧的部署状态历史；若已无法查询到成功证据，发布检查仍会拒绝，
维护者应先重新执行该 commit 的受保护生产部署。仓库外仍需配置 `production` 与
`release` environment 的审批保护，以及防止未授权创建版本标签的 ruleset。

API 契约依据：[List deployments](https://docs.github.com/en/rest/deployments/deployments#list-deployments)
和 [List deployment statuses](https://docs.github.com/en/rest/deployments/statuses#list-deployment-statuses)。
