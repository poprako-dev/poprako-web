# Contributing

PopRaKo 使用 main-only 集成流程：

1. 功能和修复从独立分支发起 pull request，以 `main` 为目标分支。
2. 必需检查全部通过并解决 review threads 后才能合入；每次合入都会部署生产版本。

禁止直接 push、强推或删除 `main`。保持 pull request 聚焦，并使用 `feat:`、
`fix:`、`refactor:`、`test:`、`docs:`、`ci:` 或 `chore:` 等 conventional commit
类型。

## 必需检查

```sh
sh scripts/ci-check.sh
```

该入口会锁定安装依赖、执行 ESLint、运行单元测试、构建应用和 Storybook。
ESLint 对全部 TypeScript/TSX 文件执行 100 字符行长检查，包括未提交的修改。
本地运行 `deno task lint` 即可检查；完整检查与 CI 都使用同一规则，
无需 Git 历史、基准 SHA 或额外环境变量，也没有历史代码豁免清单。

Deno 2.9 是受支持的运行时和包管理工具。`AGENTS.md` 与
`.agents/skills/` 中仍在使用的项目规则对所有变更生效。

更新 API 调用时，应在 API 边界把 `src/types/raw/` 的蛇形结构转换为
`src/types/` 的领域类型，并同步后端生成的 `docs/swagger.json`。不要手工维护
第二份 OpenAPI 快照。

生产部署脚本和 GitHub Actions 的修改必须通过 pull request 审核。不得提交凭据、
私钥、主机公钥或私有基础设施地址；公开域名和非敏感部署拓扑应记录在部署文档中。
