# Contributing

PopRaKo 使用两步集成流程：

1. 功能和修复 pull request 以 `dev` 为目标分支。
2. 定期将 `dev` 合入 `main`；只有 `main` 会通过受保护环境部署生产版本。

不要从功能分支或 `dev` 部署。保持 pull request 聚焦，并使用 `feat:`、`fix:`、
`refactor:`、`test:`、`docs:`、`ci:` 或 `chore:` 等 conventional commit 类型。

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

生产部署脚本和 GitHub Actions 的修改必须通过 pull request 审核，且不得提交
凭据、私钥、真实主机名或其他基础设施标识。
