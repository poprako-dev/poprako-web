# poprako-web

PopRaKo 漫画翻译项目管理平台的 Web 客户端，使用 React、TypeScript、Vite 和
Tailwind CSS 构建。项目目前处于活跃开发阶段。

客户端提供团队工作区、漫画与章节管理、任务分配、成员管理、系统邮件和漫画
翻译器。生产构建是静态站点，默认通过同源 `/api/v1` 访问
[`poprako-server`](https://github.com/poprako-dev/poprako-server)。

## 环境要求

- Node.js 24
- pnpm 11

`package.json` 固定了受支持的工具链范围和 pnpm 版本。请使用 pnpm，不要使用
npm、Yarn 或 Bun 安装依赖。

## 本地开发

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

开发服务器把 `/api` 代理到 `http://localhost:8888`。如需连接其他 API，可复制
环境变量模板并覆盖地址：

```sh
cp .env.example .env.development
```

## 常用命令

```sh
pnpm lint
pnpm test:unit
pnpm build
pnpm build-storybook
sh scripts/ci-check.sh
```

`scripts/ci-check.sh` 是仓库和 CI 共用的权威检查入口；`justfile` 仅提供本地快捷
命令，不是 CI/CD 接口。

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
