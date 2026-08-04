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
修改 TypeScript/TSX 时还须遵守 100 字符行长限制；CI 对本次变更新增的行执行
检查。`scripts/line-length-baseline.txt` 只冻结启用 CI 前的既有债务；修改基线
需要独立说明和审查，不能用于放过新代码。

Node.js 24 和 pnpm 11 是受支持的工具链。`AGENTS.md` 与
`.agents/skills/` 中仍在使用的项目规则对所有变更生效。

更新 API 调用时，应在 API 边界把 `src/types/raw/` 的蛇形结构转换为
`src/types/` 的领域类型，并同步后端生成的 `docs/swagger.json`。不要手工维护
第二份 OpenAPI 快照。

生产部署脚本和 GitHub Actions 的修改必须通过 pull request 审核。不得提交凭据、
私钥、主机公钥或私有基础设施地址；公开域名和非敏感部署拓扑应记录在部署文档中。
