# P001 — 固定 Native 工具链并建立迁移诊断基线

计划状态：ready（设计）；实施状态：in-progress（隔离验证通过，项目工具链落地中）。
前置工作包：无；这是首批入口。

负责人：工具链负责人；独占 package.json、deno.json、deno.lock、根工具配置。

## 目标与范围

目标依赖精确锁定，安装与所有工具入口可运行；现有代码在新规则下的诊断真实登记并分配。

## 依据与开始条件

- [S01](../spec/01-toolchain.md)
- [S07](../spec/07-quality-and-delivery.md)
- 基线无未识别变化；前置包的开始/完成门禁已经核实，新的失败有负责人与阻断范围。
- 用户已授权本次迁移；若执行者只接到文档任务，不得将本计划误当已开始的生产变更。

## 文件范围

根 package/deno/lock、TypeScript、ESLint、Prettier、PostCSS、Vite/Vitest 配置；新增工程要求文档草案。尚未迁移的源码诊断只登记，格式化和业务文件搬迁交给后续包。

精确输入与去向见 [file-map.csv](../migration/file-map.csv) 中 plan=P001 的行。后续收敛修改遵循本节明确范围。

<!-- FILE_TABLE_START -->

基线文件：9 项。附表生成自迁移清单；以 source 为责任身份。

| 原文件 | 动作 | 最终去向 |
| --- | --- | --- |
| `.node-version` | delete | 删除；统一 Deno 2.9 |
| `deno.json` | update | `deno.json` |
| `deno.lock` | update | `deno.lock` |
| `eslint.config.js` | update | `eslint.config.js` |
| `package.json` | update | `package.json` |
| `tsconfig.app.json` | update | `tsconfig.app.json` |
| `tsconfig.json` | update | `tsconfig.json` |
| `tsconfig.node.json` | update | `tsconfig.node.json` |
| `vite.config.ts` | update | `vite.config.ts` |

新增文件 / 新职责（含从旧源提前提取的唯一目标）：

| 目标 | 职责 | 验证 |
| --- | --- | --- |
| `src/application/vite-base.ts` | 无route生成副作用的构建共同配置 | Vite/Storybook/浏览器脚本独立启动 |
| `postcss.config.mjs` | Native Tailwind4.1 PostCSS接入 | 生产CSS与主题 |
| `.prettierrc.json` | 固定Prettier排版 | format:check |
| `.prettierignore` | 仅锁/生成输出等精确工具范围 | 手写源码全量检查 |
| `vitest.integration.config.ts` | jsdom/RTL项目含.test.tsx | ST-01..ST-07 |
| `src/application/test/setup.ts` | RTL/浏览器API测试初始化 | 夹具与网络隔离 |

<!-- FILE_TABLE_END -->

## 实施步骤

1. 先确认 baseline 两个提交并重新检查工作区；建立隔离迁移分支。保存现有 typecheck、lint、test:unit、build 和 Storybook 启动结果；记录变化，禁止覆盖用户并行修改。
2. 先在仓库外临时目录使用精确版本清单验证安装和工具启动，再按 S01 修改项目精确版本及 Deno 任务，采用 Native React/Vite/TS/Tailwind/Zustand/Router/测试工具组合，Web 专用依赖严格按处置表执行；react-router-dom 暂时精确保留 7.18.3；P003 清除生产调用，P009 完成 stories 调用迁移后才删除该依赖。
3. 配置 Native 的 Prettier、strict TS 与目标 ESLint 组合；移除不兼容 Unicorn 的启用。为遗留 disable 指令、旧类型风格等完整记录诊断到迁移执行记录，按文件主负责人分派，不能关闭 no-unused-disable 或排除整个旧目录。
4. 将 Tailwind 构建接入改为确定的 PostCSS 方式，保留 CSS 语义与压缩 Worker 打包需求；移除 React19 不兼容 Inspector。路由插件的正式接入由 P003，Storybook 独立配置由 P009。
5. 通过 Deno 2.9.6 安装并提交目标 lock；在空缓存/干净安装条件核验 peer 与任务命令能启动。依赖问题用最小复现记录，不自动改回旧主版本。
6. 在本包建立vitest.integration.config.ts、application/test/setup.ts以及test:integration任务（jsdom/RTL），使P002/P003的.test.tsx门禁可执行；同时固定test:browser-install和Playwright Chromium，供P007使用。P009后续扩充夹具与Storybook，不重复创建基础配置。
7. 生成迁移诊断清单：每项有错误位置、产生条件、负责工作包和阻断范围。把实际通过结果与尚未收敛的完整源码 lint/type 结果分开记录。

## 兼容要求

以 [兼容矩阵](../migration/compatibility-map.md) 和所引用 spec 为准；不改变本包未明确授权的后端协议、公开 URL 或用户数据格式。

## 验证

- [ ] 核对 manifest 与 lock 的全部目标版本，确认没有 npm/pnpm/yarn/Bun 新锁文件。
- [ ] 运行目标 typecheck、lint、test:unit、build；所有工具必须可启动，任何失败逐项归属，实际功能回归须在依赖包继续前处理。
- [ ] 验证 new TS compiler、ESLint、Prettier、Vitest、Storybook 的 peer 支持；不能以原基线240测试替代目标环境结果。

## 完成标准

- [ ] S01 每项依赖已处理；react-router-dom@7.18.3 是唯一记录至 P009 的过渡路由依赖；安装可复现，无配置级启动错误。
- [ ] 没有未归属诊断；阻断工具运行的兼容问题已经解决。
- [ ] 该包不宣称全仓严格检查通过；剩余已定位源码迁移诊断由相应后续工作包负责。

## 风险与恢复

Native 精确版本可能暴露旧依赖类型问题。恢复方式是撤回本包的配置/lock组合，不能只退单个包留下混合锁；失败时暂停依赖链。

## 协作与执行记录

前置依赖未满足时禁止开始本包。此包涉及共同契约或全仓装配，按计划索引串行集成。

执行时在本节追加日期、实际提交、命令和退出码、发现/修复以及未完成项；不要预先勾选。

## 需求追踪

R1-01、R1-02、R1-05、R1-06、R1-07、R1-08、R2-06、R6-01、R6-02、R6-03、R6-08、R6-16。条款决定与验收证据见[需求矩阵](../requirements-matrix.md)和[覆盖审查](../review/coverage-matrix.md)。
