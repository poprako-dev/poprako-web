# poprako-web

PopRaKo 漫画翻译项目管理平台的 Web 客户端，使用 React、TypeScript、Vite 和
Tailwind CSS 构建。项目目前处于活跃开发阶段。

客户端提供团队工作区、漫画与章节管理、任务分配、成员管理、系统邮件和漫画
翻译器。生产构建是静态站点，通过 `https://api.poprako.com/api/v1` 访问
[`poprako-server`](https://github.com/poprako-dev/poprako-server)。

## 环境要求

- Node.js ^26.12，至少 26.12.1，独立安装且不含 npm
- pnpm 12.11.2，独立安装的唯一包管理器

Node.js 范围由 `.node-version` 和 `package.json` 统一为 `^26.12`；安装脚本从官方
发布索引选择最新的 26 系列稳定版本，并拒绝低于 26.12.1 的已知不安全版本。
Node.js 26 当前为 Current，目标为 LTS（官方计划于 2026-10-28 转入 LTS）。
CI 与本地使用相同安装脚本与版本检查。
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

生产构建由 GitHub Actions `production` environment 的 `DEPLOY_API_BASE_URL` secret
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
- [1.0.0 仓库审计与清理进展](docs/release-1.0.0-repo-audit.md)
- [维护与需求待办](docs/maintenance-follow-ups.md)
- [依赖兼容补丁](docs/dependency-workarounds.md)
- [项目与 Agent 规范](AGENTS.md)
- [后端 OpenAPI 快照](docs/swagger.json)

## 致谢

感谢电容、[Pkuism](https://github.com/pkuislm)、
[星辰大海](https://github.com/SeaAndStars) 和秋叶声生，以及
[萌翻](https://github.com/moeflow-com/moeflow) 与
[LabelPlus](https://github.com/LabelPlus/LabelPlus) 等开源项目。

感谢 Adobe 及思源黑体项目贡献者提供的
[思源黑体（Source Han Sans）](https://github.com/adobe-fonts/source-han-sans)。
本项目使用其简体中文可变字体，字体按
[SIL Open Font License 1.1](public/SourceHanSansSC-LICENSE.txt) 分发。

## License

Copyright (c) 2026 PopRaKo contributors.

[GNU Affero General Public License v3.0 only（AGPL-3.0-only）](LICENSE)

上述许可适用于项目自有代码；第三方字体和依赖保留各自许可。思源黑体按 OFL 1.1
分发，JSZip 选择其 MIT 许可选项。

应用和 Storybook 构建会附带项目 `LICENSE.txt`、打包依赖的
`THIRD-PARTY-LICENSES.md`、包含 Worker 依赖的 `RUNTIME-LICENSES.txt`，以及
[字体许可](public/SourceHanSansSC-LICENSE.txt)和
[附带声明](public/THIRD-PARTY-NOTICES.txt)。来源核对与限制见
[第三方许可核查](docs/third-party-licenses.md)。
