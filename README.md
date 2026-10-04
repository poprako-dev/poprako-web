# poprako-web

PopRaKo 漫画翻译项目管理平台的 Web 客户端，使用 React、TypeScript、Vite 和
Tailwind CSS 构建。项目目前处于活跃开发阶段。

客户端提供团队工作区、漫画与章节管理、任务分配、成员管理、系统邮件和漫画
翻译器。生产构建是静态站点，通过 `https://api.poprako.com/api/v1` 访问
[`poprako-server`](https://github.com/poprako-dev/poprako-server)。

## 环境要求

- Deno 2.9.6

`package.json` 固定了受支持的 Deno 版本。请使用 Deno，不要使用 Bun、npm、
pnpm 或 Yarn 安装依赖。

## 本地开发

```sh
deno install
deno task prepare:dependencies
deno task dev
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
文件，应修改路由输入后运行 `deno task generate`，不要直接编辑它。

路由目录、模块依赖边界、测试和命名规则见 [AGENTS.md](AGENTS.md)。

## 常用命令

```sh
deno task lint
deno task typecheck
deno task test:unit
deno task test:integration
deno task test:storybook
deno task test:script
deno task contrast:candidates
deno task contrast:check
deno task check
deno task build
deno task build-storybook
deno task storybook
deno task project:check
deno task generate:check
sh script/ci-check.sh
```

`script/ci-check.sh` 是仓库和 CI 共用的权威检查入口；`justfile` 仅提供本地快捷
命令，不是 CI/CD 接口。`deno task test:storybook` 会在 Chromium 中运行 Storybook
交互与可访问性测试；`deno task generate:check` 只读检查生成路由文件是否最新。

Storybook 开发服务通过 `script/storybook-deno.mjs` 适配 Deno 的依赖读取和命令执行，
无需安装其他包管理器。

## 配色与对比度

界面保留浅色背景、米色导航和叶绿品牌色。`appearance.css` 保存背景与装饰色，
`src/application/readable-colors.css` 提供文字、实心操作按钮、控件边界和焦点色。
淡色品牌块使用 `brand-leaf`，浅底上的品牌文字使用 `text-leaf`，白字按钮使用
`action-leaf`；一个颜色承担不同用途时，应拆分语义角色，避免一起加深大面积背景。

采用 [WCAG 2.2 文字要求](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)：
普通文字至少 4.5:1，大字至少 3:1；必要控件边界、图标、状态标记至少 3:1。
纯装饰边框和分隔线不套用这个下限。hover、焦点、选中状态分别检查内容与实际背景，
不要求两个不同时出现的背景色互相达到 3:1。焦点采用 2px 深色外轮廓和白色间隔，
这是项目设计规则，不能据此宣称完整的 WCAG 合规。
已折叠的注册字段、已关闭的菜单不参与 Tab；悬停显示的操作按钮在键盘焦点下也显示。
加载时只淡化图片或装饰层，文字和状态标签保持清晰。

`deno task contrast:candidates` 根据 `script/contrast-contract.mjs` 输出候选 CSS 和
JSON，不改写源码。[apcach](https://github.com/antiflasher/apcach) 显式使用 `wcag`
与 `srgb`；通过的颜色保持原样，失败的颜色优先只调整 OKLCH 明度，必要时降低彩度。
候选序列化后由 [Color.js](https://colorjs.io/docs/contrast.html) 独立验证所有声明背景、
色域与对比度。报告记录 `deltaEOK` 和透明度变化；没有冻结颜色或色差预算硬限制，
具体视觉改动通过 PR 的前后截图复核。三项颜色/axe 依赖均为开发依赖。

`deno task contrast:check` 执行全部 Storybook 交互后的 axe 检查，以及采用本地 API
夹具的实际路由检查。桌面 1440×900、移动端 390×844 使用相同内容、时间和浏览器。
覆盖登录/注册、工作区、漫画详情、成员、邮件、设置、工具、远端译者和只读视图，
并检查 hover、键盘焦点、弹窗、权限、图片背景、空数据、错误、加载与重试状态。
离线草稿与 BaseTranslator 编辑状态由现有 Storybook 场景覆盖；当前项目没有独立的
LocalTranslator 路由。测试请求不连接真实后端，未声明的 API 请求会导致检查失败。

axe 的文字对比度 `incomplete` 不默认通过。检测器必须给出实际颜色叠加和数值，或
明确的几何/可见性证据；背景图片、滤镜、任意伪元素或遮挡无法证明时失败。
底部下划线可用与文字框分离的几何证据解释；滚动裁剪和已验证的不透明覆盖面板保留
位置证据。活动模态弹窗外的不可交互背景单独记录，不伪造对比度数值。
检测器的浏览器回归用例验证嵌套透明度、指针穿透文本，以及拒绝渐变和未知遮挡。
必要非文本元素通过所属组件的 `data-contrast="icon|border|fill"` 声明配对；输入框、
有名称的图标按钮和当前键盘焦点也自动检查。添加新的必要视觉指示时应同时添加声明。
图片上的文字使用不透明白字与足够深的遮罩；报告验证纯白、纯黑图片两端。

报告、失败截图和路由截图写入忽略的 `test-resource/generated/contrast/`，包括
`storybook.json`、`storybook.log`、`routes.log` 和 `after/report.json`。
旧的对比度债务白名单已移除；违例、缺失场景证据、未处理的检测盲区或夹具错误都失败。
`deno task check` 包含此门禁。CI 的独立 contrast 作业限时 10 分钟，无论成功与否都会
上传 `contrast-evidence`，并纳入必需的 `Frontend checks` 汇总。
PR 的 CI 还会用相同夹具自动捕获 base 提交，产物中的 `reference/` 与 `after/` 可直接对照。
本地设置 `CONTRAST_REFERENCE_SHA` 为完整提交 SHA，也可以让门禁自动解包并捕获基线。

需要前后对照时，将基线提交解包到临时目录并复用当前依赖，然后运行：

```sh
deno run -A script/test-contrast-browser.mjs --capture --reference-source /tmp/poprako-reference
deno task contrast:check
```

基线截图存于 `reference/`，修正后的截图存于 `after/`。`--capture` 只用于保留原始
失败证据；正常门禁始终要求所有已覆盖场景通过。自动测试的覆盖范围由现有故事和
路由夹具限定，新增页面与真实内容仍需增加场景并复核。

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
