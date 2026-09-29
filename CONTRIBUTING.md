# Contributing

PopRaKo 使用 main-only 集成流程：

1. 功能和修复从独立分支发起 pull request，以 `main` 为目标分支。
2. 必需检查全部通过并解决 review threads 后才能合入；每次合入都会部署生产版本。

禁止直接 push、强推或删除 `main`。保持 pull request 聚焦，并使用 `feat:`、
`fix:`、`refactor:`、`test:`、`docs:`、`ci:` 或 `chore:` 等 conventional commit
类型。

## 必需检查

```sh
sh script/ci-check.sh
```

该入口会锁定安装依赖、执行 ESLint、运行单元测试、构建应用和 Storybook。
ESLint 检查全部 TypeScript/TSX 文件。完整检查还会分别检查应用、测试和 Storybook
TypeScript 程序，并运行结构依赖、生成路由、单元、集成、Storybook 和脚本检查。
本地运行 `deno task lint` 可单独运行 ESLint；完整检查与 CI 使用同一规则。

Deno 2.9 是受支持的运行时和包管理工具。`AGENTS.md` 与
`.agents/skills/` 中仍在使用的项目规则对所有变更生效。

更新 API 调用时，应在 API 边界把后端蛇形字段转换为 `src/route/**/business/` 中的
camelCase 领域类型。不要在业务模块间复制原始 API 结构，也不要手工维护第二份
OpenAPI 快照；后端契约快照位于 `docs/swagger.json`。

生产部署脚本和 GitHub Actions 的修改必须通过 pull request 审核。不得提交凭据、
私钥、主机公钥或私有基础设施地址；公开域名和非敏感部署拓扑应记录在部署文档中。
