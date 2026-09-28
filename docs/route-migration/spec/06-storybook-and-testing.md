# S06 — Storybook 与测试体系规格

历史设计草案，当前要求以 [Web requirements](../../REQUIREMENTS.md) 和 R-series
plans 为准。保留 Storybook 与 Vitest 4.1.11。

状态：ready（验收待实施）。负责计划：P001、P002—P009、P011、P012。

## S06.1 基线与保留要求

依据 Native `docs/REQUIREMENTS.md` §4.1、§6 与 Web `.storybook/main.ts`、
`.storybook/preview.ts`、`.storybook/vitest.setup.ts`、`vitest.unit.config.ts`、`vite.config.ts`、
`scripts/storybook-deno.mjs`、`scripts/storybook-deno.test.mjs`、`scripts/test-storybook-start.sh`。

保留 Storybook 10.6.0；具体依赖及 peer 兼容由 [S01](01-toolchain.md)
固定。保留现有有效 stories 和 play 测试，加入 Native 要求的 React Testing
Library。测试采用风险驱动，不设全局
覆盖率数字，不为简单移动或展示重复编写镜像测试；已有语义测试迁移后继续运行。

当前单元配置仅匹配 `src/**/*.test.ts` 且使用 Node 环境；应用 Vite 配置同时包含
Storybook browser project；CI 构建 Storybook 和执行启动
smoke，但尚未统一执行浏览器 play。目标必须
消除这三处配置限制，不能以已有构建成功代替浏览器交互验收。

## S06.2 文件归属与工具例外

1. 业务 story、测试和夹具与实现位于相同 route 的 `business`；共享 UI story 位于
   `shared/component` 对应实现旁。移除 `src/stories` 及其任何 `features`
   子目录。
2. 子路由独占故事随子路由；跨 route 场景放最近共同父 route 的
   `business/test`。验证整个 应用装配的测试放
   `application/test`，此目录作为**仅测试**的装配入口，不容纳生产业务。
3. `*.stories.tsx`、`*.stories.ts`、`*.test.tsx`、`*.test.ts`
   以源文件名为基础，保留工具后缀。 Storybook CSF metadata 必须 default
   export，作为具名导出规范的精确例外；stories 本身
   继续具名导出。`.storybook/main.ts`、`preview.ts`
   的默认配置导出同样登记为工具例外。
4. 纯脚手架 `Configure.mdx`
   及只被其使用的教程图片可以删除；有效图片夹具随使用者迁移，
   多个业务故事共同使用的非业务图片可放
   `shared/utility/test-asset`。禁止删除有效故事来通过构建。
5. 自有测试、夹具、stories 执行 400
   物理行、严格类型和命名要求；超长故事按用户场景拆分，
   公用初始化抽到同归属的测试辅助文件，不整文件关闭 lint。

## S06.3 依赖检查如何处理测试

- 生产代码遵守 S02 的自身/祖先/业务无关 shared 依赖规则，不能导入任何
  story、test 或 `business/test` 辅助文件。fixture
  也不能进入生产入口的依赖闭包。
- 普通单元测试跟随被测 module，遵守同样的 route
  归属，不通过测试特例导入兄弟业务实现。
- `application/test/**/*.test.tsx` 和最近共同父 route 的
  `business/test/**/*.test.tsx` 可以装配其下多个
  route，验证可观察导航、授权和状态；检查器仅对这些明确路径允许指向
  后代，且这些文件必须是测试或被这些测试使用的 fixture，生产消费者数量必须为零。
- 跨路由故事采用相同的共同父归属。禁止让子 route 的 story 任意引用兄弟 route
  内部。
- 路由文件中不容纳测试；所有 `business` 子树必须被文件路由生成器排除。

## S06.4 测试分层与固定入口

所有任务写入 `deno.json`，只通过 Deno 2.9.6 执行；具体依赖版本由 S01 统一。
P001先建立Node/jsdom配置、RTL setup、test:integration和固定浏览器安装入口，
供P002/P003/P007验收；P009整合Storybook及完整夹具。主题provider、设置选择与主题
decorator在P010一起实现，P009只验收既有行为和基础设施，不提前要求完整ST-07。

P001实测确认`@testing-library/jest-dom/vitest`与`vitest/config`引入的browser
matcher
全局声明不能在同一tsc程序中合并。采用D20：jsdom测试与browser/stories/工具配置分别由
严格tsc程序检查，保持所有文件有覆盖；共享生产源码可被多个程序检查。
测试setup只属于对应环境，不让生产或另一测试环境导入；不得使用排除测试后不再检查的做法。

| 任务                              | 固定职责与运行环境                                                                     |
| --------------------------------- | -------------------------------------------------------------------------------------- |
| `deno task test:unit`             | Vitest Node project；纯规则、请求转换、controller、store 测试；包含 `.test.ts`         |
| `deno task test:integration`      | Vitest jsdom project + RTL；`.test.tsx` 的页面/路由装配、焦点、主题和会话测试          |
| `deno task test:storybook`        | 独立 Storybook Vitest 配置，项目名 `storybook`；Playwright Chromium headless 运行 play |
| `deno task test:storybook-start`  | Deno 代理单测之后真实运行 `storybook --ci --smoke-test --no-open --disable-telemetry`  |
| `deno task test:browser-install`  | `deno run -A npm:playwright@1.63.0 install chromium`，只安装锁定测试浏览器             |
| `deno task storybook`             | 经 Deno 代理启动 6006 开发预览                                                         |
| `deno task build-storybook`       | 经同一 Deno 代理构建静态 Storybook                                                     |
| `deno task test:compress-browser` | 真实生产 Worker 压缩/解压与取消、资源清理功能回归                                      |
| `deno task test:bounded-browser`  | 真实浏览器定界压缩、批处理及下载回归                                                   |
| `deno task test:script`           | Deno 脚本单测，包括 Storybook 代理和工程检查器；不重复真实启动 smoke                   |
| `deno task test:frontend`         | 顺序执行 unit、integration、storybook；失败返回非零                                    |
| `deno task test`                  | 顺序执行 test:frontend 与 test:script；失败返回非零                                    |

CI 浏览器 job 先安装受控 Chromium 及 runner 所需系统依赖，再执行上述任务。开发
Windows/macOS 不要求另装系统 Google Chrome。现有 browser 脚本的
`channel: "chrome"` 改为受控 Chromium； 内存采样 `ps` 和系统 `xz`
的互操作指标留作标明环境条件的附加诊断，不作为跨平台基础功能测试
的前置。`--large` 压力用例单独运行，不每次阻塞普通检查。

`test:compress-browser` / `test:bounded-browser`
负责已有端到端脚本的功能部分，CI/P012 必须执行；具体 `check`
编排及部署脚本测试见 S07。测试结果和未运行原因写入实际验收记录。

## S06.5 Vite、路由与 Deno 隔离

1. 提取只包含 React、Tailwind、别名和通用资源处理的 Vite
   配置片段，应用构建才加入 TanStack 文件路由插件；Storybook、其 browser test
   和生成的浏览器 fixture 页面不得 意外执行应用路由生成。
2. `.storybook/main.ts` 明确采用独立 Storybook Vite 配置（`viteConfigPath`
   指向该配置）； 不通过运行后按插件名称过滤的方式删除 TanStack。Storybook
   Vitest 配置显式使用
   `storybookTest({ configDir: ... })`、`playwright()`、Chromium 和 annotations
   setup。
3. application 路由集成测试使用真实生成的 route tree、`createMemoryHistory`
   和测试用依赖 装配，不重新造一套 React Router 路由。单独 UI story 无需
   Router；用到导航时使用 同一路由契约的 memory history decorator。
4. `scripts/storybook-deno.mjs` 迁为
   `script/storybook-deno.mjs`，保留包管理代理能力和 dispatcher
   启动路径。该代理使用 Storybook internal 导出，升级时必须复核真实启动与
   参数传递，不能只跑 import 单测。与 `storybook-deno.test.mjs` 一起更新路径。
5. 原 shell 启动 smoke 包装迁为 Deno 脚本；保留“代理单测 + 真实进程
   smoke”两步、子进程 exit code
   和清理。所有辅助脚本使用仓库相对路径，测试不依赖开发者的绝对路径或 npm 命令。
6. 更新 `.storybook/preview` 样式引用和主题 decorator，复用 S05 主题实现。a11y
   自动检查 从 `todo` 改为
   `error`；修复有效场景中的实际问题，工具误报有精确规则/故事例外。

## S06.6 夹具隔离和清理契约

- 每个用例使用独立路由 history、业务数据、store 初始状态与 mock
  响应。不得使用真实 token、 账户或后端。预先写入 `app-store` 等键的夹具必须在
  store hydrate 之前安装。
- beforeEach 记录待更改的 localStorage 键、store
  snapshot、fetch、定时器和监听器； afterEach/Storybook cleanup
  恢复原值并取消请求。测试不调用 `localStorage.clear()` 破坏
  不属于自身的键。单测仍必须复位 store 内存，不能只清理 storage。
- 业务请求一律显式 mock；未知业务 URL 立即抛错，使测试失败，不能 fall through
  到真实 `/api`。Storybook静态模块、同源图片等构建资源正常加载，不被业务 mock
  误拦截。
- `BaseTranslator.stories.tsx` 的 Unsplash 图和 `MemberList.stories.tsx` 的
  Dicebear 头像 改成本地图片或 data URL。后续测试不依赖不可控远程图片成功。
- 测试创建的 Object URL、Worker、OPFS
  文件、timeout、订阅和网络拦截必须在成功/失败/取消
  后清理；真实浏览器使用独立临时 profile，关闭 context 后清理临时资源。
- `src/stories/features/unitSaveFixture.ts` 移到 translator 的
  `business/test`；保存 controller 单测和 stories 都可引用它，它不导入
  `storybook/test` 或 Storybook annotations。保留同 saveId
  收据重放、localId→unitId 和批量操作语义，避免夹具掩盖保存协议错误。

## S06.7 场景清单与验收

| 验收 ID / 范围      | 必须覆盖的用户行为或协议                                                                   | 计划                   |
| ------------------- | ------------------------------------------------------------------------------------------ | ---------------------- |
| ST-01 会话/路由     | 直达与刷新、身份初始化去重、失败回登录、团队选择、logout 清理、全屏/管理布局切换           | P002、P003             |
| ST-02 漫画详情      | workspace 与 comic-playground 入口、query 深链接、关闭 replace、翻译器返回、切换后迟到响应 | P004、P005             |
| ST-03 管理业务      | 成员权限、邀请、邮件读态、设置保存与失败恢复                                               | P006                   |
| ST-04 翻译保存      | 并发编辑、分批、saveId 重试、创建 ID 映射、协议错误、保存后刷新失败、翻页/退出、只读       | P008                   |
| ST-05 翻译交互      | IME、快捷键作用域、术语、搜索替换、标记、显式换行、侧栏布局、特殊字符工具栏                | P008、P009             |
| ST-06 上传与工具    | 队列取消/重试、哈希 Worker、导入导出、生产打包后的 Worker、OPFS 和下载清理                 | P004、P007             |
| ST-07 主题和通用 UI | S05 的主题矩阵、portal、焦点、锁定和错误提示                                               | P009、P010             |
| ST-08 工程          | Storybook 构建与真实启动、浏览器安装及全套 play、无外部网络夹具、生成结果不变              | P001、P009、P011、P012 |

最终验收不得只记录“build-storybook 通过”；必须分别记录静态构建、真实启动、play
和 产品浏览器回归。现有 `unitSaveController.test.ts`、`unitFlags.test.ts`
及有效故事不得因路径 迁移失去被测试 runner
发现的资格。本文编制未运行上述升级后的命令，不能据此宣称通过。
