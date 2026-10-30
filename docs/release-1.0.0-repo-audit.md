# PopRaKo Web 1.0.0 发布前仓库审计

审计日期：2026-10-25。审计基准：`1fe143c` 及当时工作区；包含尚未提交的漫画归档相关开发内容。检查范围包括 1,079 个已跟踪文件的清单、源码引用关系、配置、CI 和发布脚本。

仓库已有完整的维护基础，1.0.0 前应优先清理失效代码、一次性实验入口，以及发布文档与实际流程的不一致。以下保留初次审计发现；漫画归档改动已随 PR #91 合入，不属于遗留清理对象。清理进展见下方记录。

## 清理进度

清理基准为已合入漫画归档的 `e02becd`，准备分支为 `feat/prepare-for-release`。2026-10-26 按维护者明确指示，本轮变更采用本地提交并快进合入 `main` 的方式，跳过远端 PR 与 CI；远端仓库删除重建另行处理。此次集成不创建版本标签、不部署或发布。初次审计中已删除文件的链接指向清理前的固定 commit。

| 方向           | 本轮处理                                                                                                                                  |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 版本与变更记录 | 版本准备为 `1.0.0`；重写真实能力与维护变更，标记待发布，移除 Deno 和 React Router 7 的失实描述                                            |
| 项目许可证     | 2026-10-26 按维护者指示将自有代码改为 `AGPL-3.0-only`，同步全文、包元数据和分发声明；第三方许可独立保留                                   |
| 失效源码       | 删除九个候选文件及导航示例团队，保留现用 API、工作流、下载与会话实现                                                                      |
| 实验与脚手架   | 移除默认本机 PSD Storybook 接入、跨语言 interop 脚本及其文档命令、失效 shadcn 配置和入口；[PSD 报告](archive/psd-zstd-benchmark.md)已归档 |
| 依赖           | 移除三个 Babel preset、Immer、重复 Radix Dialog 和 onboarding 共六项直接依赖；Chromatic 与覆盖率工具待明确用途                            |
| 便笺与兼容措施 | 便笺转入[维护与需求待办](maintenance-follow-ups.md)；保留作者兜底与合并限制；补充[依赖补丁维护记录](dependency-workarounds.md)及退出条件  |
| 可访问性基线   | 实际浏览器核验后从 129 个 story／981 条历史额度收缩至 51 个 story／557 条，未增加指纹或额度；用户批准的设计例外保持独立                   |
| 常规检查       | 函数行数检查接入 `pnpm run check` 和 CI static suite；显式 `pnpm run a11y:prune-baseline` 只收缩已完整观察的历史记录                      |
| 发布契约       | 统一 `DEPLOY_API_BASE_URL` 文档；Release 构建使用生产 API 地址；自动核验完整 SHA 的成功生产部署历史，查询失败时阻止发布                   |

剩余 557 条历史额度中，551 条属于 45 个存在对比度不确定结果的旧 story，按保守规则保留；另外 6 条仍匹配完整审计发现。额度数不等于当前实际问题数，不能直接清零。已删除的旧 ReadOnlyPageStatistics story 经源码导出与实际运行清单核对后清除。

远端 environment 审批、标签保护和生产 secret 的实际配置仍属于发布前核验；本轮只修改仓库契约，不代表已部署或已发布。

### 本轮验证

| 检查                                                                     | 结果                                                                                                         |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `pnpm run check`                                                         | 通过，包含格式、五组类型、ESLint、函数行数、结构与依赖边界、测试清单、路由生成及全部测试                     |
| `VITE_API_BASE_URL=https://api.poprako.com/api/v1 sh script/ci-check.sh` | 通过，包含冻结安装、全部 static/browser/build suite、应用与 Storybook 构建，以及部署产物、原子切换和回滚测试 |
| 单元／集成／Storybook／脚本测试                                          | 分别通过 594／306／282／147 项，共 1,329 项；脚本项包含 12 项翻译器浏览器回归                                |
| 基线收缩重复执行                                                         | 282 个完整审计后仍为 557 条，确认幂等；与原基线逐项比较，无指纹或额度增长                                    |
| 依赖安全审计                                                             | `pnpm run audit` 通过，报告未发现已知漏洞                                                                    |
| 依赖锁定范围                                                             | 包记录从 923 减至 825，没有新增包版本；现用 Radix 仍通过聚合包提供                                           |
| 文档与 diff                                                              | 修改文档格式、仓库 Markdown 本地链接和 `git diff --check` 均通过                                             |

首次沙箱内完整检查在浏览器监听端口时受限；允许本机监听后，上述两个完整入口均重新通过。验证使用本地环境及模拟部署，不包含线上部署、标签发布或远端保护配置核验。

2026-10-26 追加许可证变更后，许可收集的 5 项测试、应用及 Storybook 构建均通过。两份构建中的 `LICENSE.txt` 与仓库 AGPL-3.0 正文逐字节一致，第三方声明、字体许可及依赖许可产物完整保留；本次没有触发远端 CI。

## 初次审计记录

以下保留初次审计时的发现、处理建议及当时的验证结果，当前处理状态以上方清理进度为准。

### 发布前优先处理

| 问题                                  | 依据与影响                                                                                                                                                                                | 建议                                                                                                                 |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| 版本信息仍是初始化状态                | [package.json](../package.json) 为 `0.0.0`；[CHANGELOG.md](../CHANGELOG.md) 只有 Unreleased，而且还描述 Deno、React Router 7，与当前 Node/pnpm、TanStack Router 不符                      | 发布准备提交中统一版本，重新整理真实的 1.0.0 变更记录                                                                |
| 部署文档中的 secret 名称失效          | [README.md](../README.md)、[部署文档](frontend-deploy.md) 和 [.env.example](../.env.example) 写的是 `API_BASE_URL`，实际 [ci.yml](../.github/workflows/ci.yml) 读取 `DEPLOY_API_BASE_URL` | 统一文档与 workflow，否则照文档配置会导致部署失败                                                                    |
| Release 与生产构建使用不同的 API 配置 | [release.yml](../.github/workflows/release.yml) 构建时没有注入 `VITE_API_BASE_URL`，会使用 `/api/v1`；生产部署则强制使用 `https://api.poprako.com/api/v1`                                 | 明确 Release 包的用途，统一构建契约。现有 nginx 有 `/api` 代理，因此不能直接判为不可用，但下载产物与生产产物行为不同 |
| 发布策略没有完整落实到自动检查        | [RELEASE.md](../RELEASE.md) 要求只能发布成功部署过的 commit；[release.yml](../.github/workflows/release.yml) 只检查 commit 属于 main 历史                                                 | 发布前核验对应 SHA 的成功部署记录；目前这条要求依赖人工审批落实                                                      |

### 失效代码删除候选

通过静态引用分析和逐项搜索，以下文件没有来自应用、测试、Storybook 或工具配置的有效引用。其中 `UserTag` 仅被同样失效的 `RoleTag` 引用。实际删除时仍应重新运行检查，以覆盖后续开发引入的新引用。

| 文件                                                                                                                                                                                                                  | 判断                                                       |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| [configuration.ts](https://github.com/poprako-dev/poprako-web/blob/e02becd7fa055f9ff901e53b7dd906150901e429/src/route/business/configuration.ts)                                                                      | 重复的 API 基址配置；实际应用使用 `src/application/api.ts` |
| [identity/auth.ts](https://github.com/poprako-dev/poprako-web/blob/e02becd7fa055f9ff901e53b7dd906150901e429/src/route/business/identity/auth.ts)                                                                      | 已无人使用的旧登录、注册、用户更新类型                     |
| [http-response.ts](https://github.com/poprako-dev/poprako-web/blob/e02becd7fa055f9ff901e53b7dd906150901e429/src/shared/utility/http-response.ts)                                                                      | 已无人使用的 `FormatResp` 响应类型                         |
| [api/identity/index.ts](https://github.com/poprako-dev/poprako-web/blob/e02becd7fa055f9ff901e53b7dd906150901e429/src/api/identity/index.ts)                                                                           | 无消费者的转导出入口                                       |
| [presigned-download.ts](https://github.com/poprako-dev/poprako-web/blob/e02becd7fa055f9ff901e53b7dd906150901e429/src/api/presigned-download.ts)                                                                       | 无消费者的流式下载实现                                     |
| [QuickWorkflowActions.tsx](https://github.com/poprako-dev/poprako-web/blob/e02becd7fa055f9ff901e53b7dd906150901e429/src/route/_authenticated/_shell/business/comic-detail/QuickWorkflowActions.tsx)                   | 未接入的旧流程操作组件                                     |
| [RoleTag.tsx](https://github.com/poprako-dev/poprako-web/blob/e02becd7fa055f9ff901e53b7dd906150901e429/src/route/_authenticated/_shell/business/comic-detail/RoleTag.tsx)                                             | 未接入的旧分工组件                                         |
| [UserTag.tsx](https://github.com/poprako-dev/poprako-web/blob/e02becd7fa055f9ff901e53b7dd906150901e429/src/route/_authenticated/_shell/business/comic-detail/UserTag.tsx)                                             | 只服务于上述失效组件                                       |
| [translator-project-test-fixture.ts](https://github.com/poprako-dev/poprako-web/blob/e02becd7fa055f9ff901e53b7dd906150901e429/src/route/_authenticated/translator/business/remote/translator-project-test-fixture.ts) | 连测试也不再使用的 fixture                                 |

[navigation-config.ts](../src/route/_authenticated/_shell/business/navigation/navigation-config.ts) 还保留三个虚构汉化组及“本轮使用静态配置，后续升级为 store + API”的注释。实际侧栏已经通过 [useTeamConfigs](../src/route/_authenticated/_shell/business/navigation/use-team-configs.ts) 从会话读取团队，应删除这段示例数据与过期注释，保留正常导航配置。

### 临时实验与脚手架遗留

#### 本地 PSD 实验接入正式 Storybook 配置

[.storybook/main.ts](../.storybook/main.ts) 会根据本机是否存在某个生成文件，额外加载 story；[local-revision-psd.ts](https://github.com/poprako-dev/poprako-web/blob/e02becd7fa055f9ff901e53b7dd906150901e429/.storybook/local-revision-psd.ts) 专门服务一次实验的目录。这使同一份 checkout 在不同机器上出现不同内容。

建议移除默认接入；确有持续价值时，改成显式运行、可复现的 benchmark 工具。

#### 压缩互操作实验游离于维护流程

[test-compress-interop.mjs](https://github.com/poprako-dev/poprako-web/blob/e02becd7fa055f9ff901e53b7dd906150901e429/script/test-compress-interop.mjs) 内嵌调用 `uv run … python`，违反项目统一 Node 脚本栈的要求，没有 package script 或 CI 入口。清理复核发现压缩工具 README 曾有手工执行入口，初次审计的“没有文档入口”判断有误；删除脚本时已同步移除该说明，正式单元和浏览器验证保留。

#### shadcn 生成配置已经失效

[components.json](https://github.com/poprako-dev/poprako-web/blob/e02becd7fa055f9ff901e53b7dd906150901e429/components.json) 仍指向 `@/components`、`@/lib/utils`、`@/hooks` 等不存在的旧目录；[justfile](../justfile) 的 `shad` 命令仍会调用它。继续使用可能重新生成违反当前结构规范的目录。应成套修正或删除入口。

#### 零散便笺应退出正式文档

[docs/buff.md](https://github.com/poprako-dev/poprako-web/blob/e02becd7fa055f9ff901e53b7dd906150901e429/docs/buff.md) 只有一句产品想法；[docs/todo.md](https://github.com/poprako-dev/poprako-web/blob/e02becd7fa055f9ff901e53b7dd906150901e429/docs/todo.md) 的任务没有明确范围和验收条件。

尤其“409 静默重试三次”已无法准确描述现状：[嵌稿写入](../src/route/_authenticated/_shell/business/comic-detail/upload/artwork-write.ts) 有特定条件的重试，[审查冲突](../src/route/_authenticated/reviewer/business/editor/review-http-source.ts) 则另有处理。建议逐项转为明确 issue，再删除便笺。

#### PSD 压缩报告适合归档

[psd-zstd-benchmark.md](archive/psd-zstd-benchmark.md) 有实验价值，但依赖未跟踪的本地素材和生成目录。可保留为历史性能依据，补充环境与复现条件，不宜作为当前性能保证。

### 仍在生效的临时措施

#### 依赖声明文件补丁

[prepare-dependencies.ts](../script/prepare-dependencies.ts) 会直接修补 Storybook 和 Radix 的声明文件，并绑定版本、文件名和哈希。当前类型检查依赖它，不能直接删除。应记录对应上游问题、保留原因和移除条件。

#### 历史可访问性豁免基线

[contrast-baseline.json](../.storybook/contrast-baseline.json) 保留了 129 个 story、981 条历史对比度豁免记录，约 360 KB。这是历史允许额度，不代表本次仍存在 981 个问题。

[比较逻辑](../script/contrast-baseline.ts) 会拒绝新增问题，但不会清理已经失效的记录；[pnpm-workspace.yaml](../pnpm-workspace.yaml) 也仍以“迁移期间”为由固定检测器版本。应重新核对并收缩基线。

另一个 [contrast-exceptions.json](../.storybook/contrast-exceptions.json) 明确记录了用户批准的设计例外，应分别对待。

#### 历史文本作者兜底

[use-editor-unit-actions.ts](../src/route/_authenticated/translator/business/editor/use-editor-unit-actions.ts) 会为缺失翻译者的历史文本填入当前用户。这是有实际数据含义的兼容措施，需要后端契约和历史数据迁移共同解决，不能只删除 FIXME。

#### 术语库强制合并限制

[termbase.ts](../src/api/terminology/termbase.ts) 的 `forceMerge: false` 是当前明确的功能限制，可以保留到 1.0；待办应进入正式需求管理。

#### 函数行数检查仍处于过渡状态

函数行数检查已经全部通过，但 [CONTRIBUTING.md](../CONTRIBUTING.md) 仍称其为“独立存量审查任务”，且没有接入 `check` 或 CI。既然已满足规范，可以结束这一过渡状态。

### 依赖精简候选

以下判断基于当前源码和配置，实际移除后必须重新验证类型检查、测试和构建，不能仅凭搜索保证安全删除。

| 依赖                                                                   | 当前情况                                           | 建议                                            |
| ---------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------- |
| `@babel/preset-env`、`@babel/preset-react`、`@babel/preset-typescript` | 没有发现配置用途                                   | 核验构建及 Storybook 依赖要求后移除冗余直接依赖 |
| `immer`                                                                | 没有直接使用，也未使用 Zustand 的 Immer middleware | 核验后移除                                      |
| `@radix-ui/react-dialog`                                               | 没有直接引用，应用使用的是 `radix-ui`              | 核验后移除冗余直接依赖                          |
| `@storybook/addon-onboarding`                                          | 初始化引导插件                                     | 移除                                            |
| `@chromatic-com/storybook`                                             | 仓库没有自动化接入证据，可能仍有手动使用           | 根据实际是否使用 Chromatic 决定                 |
| `@vitest/coverage-v8`                                                  | 没有现成覆盖率任务                                 | 按覆盖率维护需求决定                            |

相关配置见 [package.json](../package.json) 和 [.storybook/main.ts](../.storybook/main.ts)。

### 应保留的维护内容

测试、Storybook、有效 fixture、生成路由、OpenAPI 快照、许可证及现有诊断日志导出功能都有维护用途，应保留。

`dist/`、`storybook-static/`、本地 `.env`、`.omx/`、PSD 压缩包等已被忽略，未进入版本控制，不属于正式仓库污染。清理本地磁盘空间与清理 Git 跟踪内容应分别处理。

### 验证结果与范围

审计针对上述基准及当时工作区运行验证，结果不代表后续提交的检查状态。

| 检查                                                     | 结果                                         |
| -------------------------------------------------------- | -------------------------------------------- |
| 格式检查                                                 | 通过                                         |
| 应用、测试、Storybook、工具、脚本五组类型检查            | 通过                                         |
| ESLint                                                   | 通过                                         |
| 项目结构、依赖边界、测试清单                             | 通过                                         |
| 路由生成检查                                             | 通过                                         |
| 代码文件 400 行限制、函数逻辑 50 行及组件渲染 150 行限制 | 通过                                         |
| Vite 生产构建                                            | 通过，产物输出至临时目录                     |
| 单元测试                                                 | 117 个文件、590 项测试通过                   |
| 集成测试                                                 | 77 个文件、303 项测试通过                    |
| Storybook 测试                                           | 54 个文件、274 项测试通过，另有 1 个文件跳过 |
| 脚本测试，不含翻译器浏览器测试                           | 18 个文件、112 项测试通过                    |
| 翻译器浏览器回归测试                                     | 1 个文件、12 项测试通过                      |

共通过 1,291 项测试。`pnpm run check` 首次因沙箱禁止监听本地端口而中断，之后分别补跑了浏览器及剩余脚本测试并通过。未执行完整部署 CI、在线依赖审计或远端配置核验，因此不能据此认定发布链路已完成验证。

### 建议执行顺序

1. 修正版本记录、部署配置契约和发布核验流程。
2. 删除九个失效文件、未使用团队示例数据，并处理一次性实验入口和旧脚手架配置。
3. 将零散待办转为明确 issue，归档需要保留的实验依据。
4. 核验并精简依赖，补齐仍有效临时补丁的退出条件。
5. 收缩历史可访问性基线，将函数行数检查纳入常规检查，再执行完整 CI 和发布前验证。
