# poprako-web

PopRaKo 漫画翻译项目管理平台的 Web 客户端，使用 React、TypeScript、Vite 和
Tailwind CSS 构建。项目目前处于活跃开发阶段。

客户端提供团队工作区、漫画与章节管理、任务分配、成员管理、系统邮件和漫画
翻译器。生产构建是静态站点，通过 `https://api.poprako.com/api/v1` 访问
[`poprako-server`](https://github.com/poprako-dev/poprako-server)。

## 环境要求

- Node.js 26.11.1，独立安装且不含 npm
- pnpm 12.11.2，独立安装的唯一包管理器

版本由 `.node-version` 和 `package.json` 固定。Node.js 26 当前为 Current，
目标为 LTS（官方计划于 2026-10-28 转入 LTS）。CI 与本地使用相同版本。
可运行 `sh script/setup-js.sh /absolute/path/to/poprako-js` 安装隔离工具链，
再按脚本输出将两个 bin 目录加入 PATH；无需 npm、npx 或 Corepack。

## 本地开发

```sh
pnpm install --frozen-lockfile
pnpm run prepare:dependencies
pnpm run dev
```

开发服务器把 `/api` 代理到 `http://localhost:8888`。如需连接其他 API，可复制
环境变量模板并覆盖地址：

```sh
cp .env.example .env.development
```

## 架构

页面使用 TanStack Router 文件路由，入口和全局 providers 位于 `src/application/`。
`src/route/` 按路由组织页面与业务模块；`src/route/business/` 存放跨路由的业务逻辑，
`src/shared/` 存放不依赖路由的通用组件、hooks 和工具。`src/route-tree.gen.ts` 是生成
文件，应修改路由输入后运行 `pnpm run generate`，不要直接编辑它。

模块依赖边界、测试和命名规则见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 常用命令

```sh
pnpm run lint
pnpm run typecheck
pnpm run test:unit
pnpm run test:integration
pnpm run test:storybook
pnpm run test:script
pnpm run build
pnpm run build-storybook
pnpm run storybook
pnpm run project:check
pnpm run generate:check
sh script/ci-check.sh
```

`script/ci-check.sh` 是仓库和 CI 共用的权威检查入口；`justfile` 仅提供本地快捷
命令，不是 CI/CD 接口。`pnpm run test:storybook` 会在 Chromium 中运行 Storybook
交互与可访问性测试；`pnpm run generate:check` 只读检查生成路由文件是否最新。

Storybook 通过本地 CLI 启动，使用 pnpm 解析依赖。
`pnpm run test:storybook-start` 可检查开发服务启动。

生产构建由 GitHub Actions `production` environment 的 `API_BASE_URL` secret
注入 API 基址；其值必须是 `https://api.poprako.com/api/v1`。这个值会映射为仅供
Vite 构建使用的 `VITE_API_BASE_URL`，不需要也不应提交 `.env.production`。

## 分支与发布

功能和修复通过 pull request 直接合入受保护的 `main`，禁止直接 push、强推和
删除 `main`。`main` 的每次合入通过受保护的 GitHub Actions `production` 环境部署，
以完整 commit SHA 标识不可变静态产物。版本标签和 GitHub Release 的规则见
[`RELEASE.md`](RELEASE.md)。

生产部署拓扑、CI 契约和回滚方式见
[`docs/frontend-deploy.md`](docs/frontend-deploy.md)。

## 文档

- [贡献指南](CONTRIBUTING.md)
- [安全策略](SECURITY.md)
- [支持渠道](SUPPORT.md)
- [发布策略](RELEASE.md)
- [项目与 Agent 规范](AGENTS.md)
- [后端 OpenAPI 快照](docs/swagger.json)

## 致谢

感谢电容、[Pkuism](https://github.com/pkuislm)、
[星辰大海](https://github.com/SeaAndStars) 和秋叶声生，以及
[萌翻](https://github.com/moeflow-com/moeflow) 与
[LabelPlus](https://github.com/LabelPlus/LabelPlus) 等开源项目。

## License

[MIT](LICENSE)
