# Organization Transfer Readiness Checklist

此清单用于把个人仓库迁移到
`https://github.com/poprako-dev/poprako-web`。代码内准备项可以在迁移前完成；
GitHub 组织侧设置必须在迁移后立即验证。

## 1. 仓库身份与入口

- [x] 统一包名、文档和元数据为 `poprako-web`。
- [x] 将仓库 URL 指向 `poprako-dev/poprako-web`。
- [x] 用项目 README 替换 Vite 模板 README。
- [x] 添加 MIT `LICENSE`。
- [x] 添加贡献、安全、支持、行为和发布策略。
- [ ] 在 GitHub 设置 description、website 和 topics。
- [ ] 确认组织内不存在同名仓库或 fork。

## 2. 清理个人与过时状态

- [x] 删除不受支持的个人 agent hook 和重复 Copilot 规则。
- [x] 删除与当前 `Result<T>` API 约定冲突的旧 API skill。
- [x] 删除放置错误且依赖 Bun 的旧 line-length skill。
- [x] 删除未引用的 UI 原型、临时替换文件和完成的迁移计划。
- [x] 删除旧后端发布脚本和旧手工前端 SSH 发布入口。
- [x] 删除 `docs/swagger.previous.json`，只保留一个 OpenAPI 快照。
- [x] 将本地 agent 状态和环境文件加入 `.gitignore`。
- [x] 移除真实域名、旧仓库名和个人 GitHub URL。

### 验收

- [ ] 扫描旧个人 owner、旧短仓库名、真实域名和绝对 home 路径时不返回结果。
- [x] 所有根文档链接到的文件都存在。
- [x] 仓库只跟踪一个生成的 OpenAPI 文件。

## 3. 工具链与检查标准

- [x] 固定 Node.js 24 和 pnpm 11。
- [x] 在 `package.json` 声明 package manager、engines、license 和 repository。
- [x] 添加可直接运行的 `pnpm test:unit`。
- [x] 建立 `scripts/ci-check.sh` 作为本地与 CI 的单一检查入口。
- [x] CI 使用 frozen lockfile，并执行 lint、单元测试、应用构建和 Storybook 构建。
- [x] 对变更新增的 TypeScript/TSX 行执行 100 字符限制，并冻结既有债务基线。
- [ ] 在 `dev` 和 `main` 分支规则中把 CI 设为 required check。

## 4. CI/CD 与供应链

- [x] pull request 以最小只读权限运行 CI。
- [x] `main` 部署依赖全部必需检查。
- [x] 生产部署使用受保护 environment 和完整 commit SHA。
- [x] SSH 强制私钥、BatchMode 和固定 known-host 校验。
- [x] 静态发布使用原子 symlink、健康检查、失败回滚和两版本保留。
- [x] tag release 生成静态包、依赖清单、provenance 和校验和。
- [x] 配置 npm 与 GitHub Actions Dependabot 更新。
- [x] 提供无真实凭据的 production secrets 模板。
- [ ] 创建 `production` environment，配置审批者与 secrets。
- [ ] 在 staging 主机演练部署、健康检查失败和回滚。

## 5. 组织侧迁移步骤

- [ ] 将默认集成分支从旧 `develop` 统一为 `dev`。
- [ ] 迁移仓库并确认 `main`、`dev` 与 tag 全部存在。
- [ ] 更新本地 remote：

```sh
git remote set-url origin git@github.com:poprako-dev/poprako-web.git
```

- [ ] 启用 private vulnerability reporting。
- [ ] 验证 issue forms、pull request template 和 Dependabot。
- [ ] 对 `main` 禁止 force push 和直接 push，要求 pull request、CI 与审批。
- [ ] 对 `dev` 要求 pull request 和 CI。
- [ ] 验证 GitHub 识别 LICENSE，并检查 Actions workflow 权限。
- [ ] 完成首次组织所有的 staging 演练后，再批准生产部署。
