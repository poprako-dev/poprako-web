# S01 工具链与依赖规格

历史设计草案，当前要求以 [Web requirements](../../REQUIREMENTS.md) 和 R-series
plans 为准。本文中的 P-series status 与旧版本提案不代表当前状态。

状态：设计已定；目标依赖整仓安装、编译与浏览器运行尚未实施。负责计划：P001；最终验证：P012。

## S01.1 基线与适用范围

Web 源码基线 `68cedc0943923843396f1120f44d9caeec8f160c`；Native 规范及版本基线
`74e14905431ae261919a1a74c742a2829edff2da`。证据为两仓
`package.json`、`deno.lock`、Native
`docs/REQUIREMENTS.md`、`deno.json`、`eslint.config.mjs`、`tsconfig.json`、`postcss.config.mjs`
与 Web 对应配置。本文件固定版本，不在执行时重新跟随 Native HEAD 或 latest。

Web 保持 React 浏览器应用、HTTP 后端与现有部署方式。采用 Native
的前端工具链；不引入 Tauri、Orchestra、Rust、SQLite、Specta、Cargo 或
bridge。保留 MIT 许可证。Zustand 可继续承载跨组件状态；本次不安装 TanStack
Query。Storybook 是显式保留的 Web 工程扩展。

## S01.2 包管理和版本清单

固定 Deno **2.9.6**（本机与现有 CI 均已核实），唯一安装入口为
Deno，唯一任务契约在 `deno.json`。保持 `nodeModulesDir: "auto"` 与 frozen
lock；这是 Web 为 Storybook 本地解析保留的配置，不复制 Native 的 manual
安装假设。`package.json` 保留依赖、元数据和精确
`engines.deno: "2.9.6"`，删除重复 scripts，命令迁至
`deno.json`。不提交其他包管理器锁文件。

实施期安全例外 D21：Native 固定的 Vitest 4.1.7 经冻结审计存在两个 critical
漏洞，用户已明确批准 Web 的 Vitest/browser/coverage 升级为
4.1.11；其他共同版本继续精确对齐。升级后的冻结锁与实际测试重新验收。

以下每项均是精确版本，不带 `^`、`~`。Native 已安装 package manifests
与锁文件相符；下列依赖整体在 Web 的组合运行仍须 P001/P012 验证。

| 类别       | 精确依赖                                                                                                                                                                                            |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 运行时     | `react@19.1.0`、`react-dom@19.1.0`、`@tanstack/react-router@1.170.39`、`@radix-ui/react-dialog@1.1.23`、`lucide-react@1.48.0`、`zustand@5.0.15`、`clsx@2.1.1`、`tailwind-merge@3.7.0`、`diff@9.0.0` |
| 构建和类型 | `@types/react@19.1.8`、`@types/react-dom@19.1.6`、`@types/node@26.6.2`、`@vitejs/plugin-react@6.0.2`、`typescript@6.0.3`、`vite@8.0.16`                                                             |
| 路由生成   | `@tanstack/router-plugin@1.168.40`、`@tanstack/router-generator@1.167.38`                                                                                                                           |
| 样式       | `tailwindcss@4.1.18`、`@tailwindcss/postcss@4.1.18`、`postcss@8.5.28`                                                                                                                               |
| 质量工具   | `eslint@9.39.1`、`@eslint/js@9.39.1`、`typescript-eslint@8.67.0`、`eslint-plugin-react@7.37.5`、`eslint-plugin-react-hooks@7.1.1`、`eslint-config-prettier@10.1.8`、`prettier@3.6.2`                |
| 测试       | `vitest@4.1.11`、`@testing-library/react@16.3.0`、`@testing-library/dom@10.4.2`、`@testing-library/user-event@14.6.7`、`@testing-library/jest-dom@7.0.1`、`jsdom@30.1.1`                            |

已检查的 Native peer 约束：Router plugin 要求 router `^1.170.38`，plugin-react
要求 Vite `^8.0.0`；typescript-eslint 支持 TS `>=4.8.4 <6.1.0`、ESLint9；React
plugin 支持 ESLint `^9.7`；Testing Library 支持 React19；Vitest4.1.11 支持
Vite6/7/8，且其 browser/coverage adapters 必须 **4.1.11**。plugin-react 的 React
Compiler/Babel 相关 peers 是可选，当前无启用依据，不额外安装。

### Web 专用依赖逐项处置

依据 Web 当前锁文件及本地 `node_modules/<package>/package.json` 的
peer/engines。peer 满足只证明声明兼容，不能替代运行测试。

| 依赖                          | 目标与声明依据                                                                | 必须验证                                                           |
| ----------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `@noble/hashes`               | 保留 `2.0.1`；无 peer，Node engine >=20.19                                    | 页哈希 Worker 与测试向量                                           |
| `@zip.js/zip.js`              | 保留 `2.11.1`；无 peer，Deno>=1                                               | ZIP 浏览器解压及 Worker                                            |
| `browser-image-compression`   | 保留 `2.0.2`；无 peer                                                         | 图片压缩、尺寸和失败取消                                           |
| `class-variance-authority`    | 保留 `0.7.1`；无 peer                                                         | UI variant 类型检查                                                |
| `jszip`                       | 保留 `3.10.1`；无 peer                                                        | 导入导出 round-trip                                                |
| `modern-tar`                  | 保留 `0.8.4`；无 peer，Node>=18                                               | TAR 流与浏览器入口                                                 |
| `node-liblzma`                | 保留 `5.1.1`；无 peer，Node>=22                                               | Deno安装脚本、浏览器WASM/Worker与XZ互操作                          |
| `radix-ui`                    | 保留 `1.6.7`；React/DOM peer含 `^19.0`，types为 `*`                           | 弹层、焦点、菜单；Dialog统一从精确的 `@radix-ui/react-dialog` 导入 |
| `@babel/preset-env`           | 保留 `7.29.7`；peer `@babel/core ^7.0.0-0`                                    | Storybook文档构建，锁定传递core满足peer                            |
| `@babel/preset-react`         | 保留 `7.29.7`；同上                                                           | Storybook JSX编译                                                  |
| `@babel/preset-typescript`    | 保留 `7.29.7`；同上                                                           | Storybook TS编译                                                   |
| `@chromatic-com/storybook`    | 保留 `5.3.1`；peer含Storybook10.6                                             | Storybook构建；不新增上传任务/凭据                                 |
| `@eslint-react/eslint-plugin` | 保留 `5.18.7`；eslint/typescript peer均`*`，作为Web增强                       | ESLint9配置加载、资源清理检查；不替换Native React plugin           |
| `storybook`                   | 保留 `10.6.0`；React types peer含19，Prettier含3，可选vite-plus不引入         | Deno adapter启动、静态构建                                         |
| `@storybook/addon-a11y`       | 保留 `10.6.0`；peer Storybook `^10.6.0`                                       | 无障碍报告                                                         |
| `@storybook/addon-docs`       | 保留 `10.6.0`；peer Storybook `^10.6.0`、React types含19                      | 文档构建                                                           |
| `@storybook/addon-onboarding` | 保留 `10.6.0`；peer Storybook `^10.6.0`                                       | 配置加载，删除占位stories不要求删除addon                           |
| `@storybook/addon-vitest`     | 保留 `10.6.0`；peer Vitest/browser/runner含4                                  | play测试和隔离fixture                                              |
| `@storybook/react-vite`       | 保留 `10.6.0`；peer Vite含8、React含19、TS>=4.9                               | 独立Vite配置、静态构建                                             |
| `@vitest/browser-playwright`  | **改为 `4.1.11`**；Native Vitest exact-peer                                   | Storybook浏览器测试                                                |
| `@vitest/coverage-v8`         | **改为 `4.1.11`**；Native Vitest exact-peer                                   | coverage启动，不设全局百分比门槛                                   |
| `eslint-plugin-jsx-a11y`      | 保留 `6.10.2`；peer ESLint含9且不含10                                         | strict规则全error                                                  |
| `eslint-plugin-react-refresh` | 保留 `0.4.26`；peer ESLint>=8.40                                              | Vite HMR，路由导出精准例外                                         |
| `eslint-plugin-storybook`     | 保留 `10.6.0`；peer ESLint>=8                                                 | stories与工具例外                                                  |
| `globals`                     | 保留直接依赖 `16.5.0`；无 peer                                                | browser/node作用域分开                                             |
| `playwright`                  | 保留 `1.63.0`；无 peer，Node>=20                                              | Deno兼容与Chromium实际启动                                         |
| `shadcn`                      | 保留 `3.8.5`；无 peer                                                         | 精确CLI路径与生成后命名处理                                        |
| `tw-animate-css`              | 保留 `1.4.0`；无 peer                                                         | Tailwind4.1.18样式构建                                             |
| `react-router-dom`            | P001暂时精确保留`7.18.3`；P003清零生产调用，P009迁完stories后删除；最终无引用 | 路由与storybook装配扫描                                            |
| `@tailwindcss/vite`           | 删除；用Native PostCSS接入                                                    | 单一路径处理CSS                                                    |
| `vite-plugin-react-inspector` | 删除；当前源码已注明调用React19删除的render                                   | 无插件过滤残留                                                     |
| `eslint-plugin-unicorn`       | 删除；`74.0.0`明确要求ESLint>=10.4，与目标9.39.1冲突                          | S01.4规则承接                                                      |

不得复制当前 lock 中的React19.2.8
peer实例。用精确新清单生成新锁文件，再在干净安装中检查 peer 图；不要通过忽略
peer、放开版本范围或切回 ESLint10 绕过冲突。冻结锁安装应满足所有实际必选
peer，optional peer 不等于必须安装其能力。

## S01.3 构建装配

- Vite使用Router plugin →
  React顺序；路由选项复用单一配置函数，详见S03。Tailwind使用
  `postcss.config.mjs` 和 `@tailwindcss/postcss`，保留现有CSS import所需含义。
- 保留 `/api` 开发代理到 `http://localhost:8888/api` 的既有rewrite行为，以及
  `VITE_API_BASE_URL`。禁止复制Native的Tauri host/port或disabled HMR配置。
- build target与CSS target显式为
  `chrome111`、`safari16.4`；浏览器上线能力另按S07.6验证。长任务继续用Web
  Worker，不在本次改为Rust。
- 保留压缩包优化配置：include ZIP/TAR、exclude
  node-liblzma；Vite8在生产Worker输出中需实测，不能因优化器更换而直接删除。
- `@`继续指向src；shadcn配置指向
  `shared/component`、`shared/utility`、`shared/hook` 与
  `application/style.css`。生成后必须满足项目命名、具名导出、400行限制。
- Storybook使用独立Vite配置，不加载路由生成plugin；共用React、别名和PostCSS约定，Deno
  adapter按S06迁移。类型检查覆盖src、script、根配置、.storybook与stories。

## S01.4 ESLint冲突与规则承接

以Native9.39.1、strictTypeChecked/stylisticTypeChecked、React7.37.5/Hooks7.1.1为基线；保留Web
React、a11y、refresh、storybook增强。启用规则全部error，`--max-warnings 0`。Prettier最后接入，只关闭冲突的排版规则。关闭
prefer-function-type/consistent-type-definitions，由专项AST检查区分数据type和纯调用interface。

Unicorn的推荐规则不会整体迁移。其风格偏好（数组非变异语法、命名词替换、scoping、简化表达式、globalThis偏好）不作为新门禁；保留底层正确性职责：

| 旧关注点                        | 承接机制                                                                                                                      |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 异步/异常吞没、Promise误用      | TS ESLint no-floating-promises、no-misused-promises、only-throw-error、use-unknown-in-catch-callback-variables；core no-empty |
| 参数/类型误用、隐式异常值       | strict TS、no-unsafe-_、no-unnecessary-_、no-non-null-assertion、switch-exhaustiveness-check                                  |
| 无效分支和表达式                | core no-constant-condition、no-constant-binary-expression、no-unreachable、valid-typeof、use-isnan；TS严格返回/穿透/索引检查  |
| 数组回调错误与无效比较          | core array-callback-return、eqeqeq、no-self-compare；压缩/排序/翻校行为回归测试                                               |
| Worker/listener/timer资源未清理 | @eslint-react/web-api资源泄漏规则、Hooks规则；Worker取消/卸载测试                                                             |
| 导出、声明、命名和目录约束      | S07项目AST/导入图检查，含顶层导出的箭头函数                                                                                   |
| 对共享数据直接排序/逆序         | 现有纯度/状态更新测试与审查；不强制ES2023方法替代ES2022可用实现                                                               |

清除失效的 `unicorn/*`
disable注释；原整文件disable必须逐一修复或缩为具体行、具体规则、具体原因。保留现有明确正确性规则eqeqeq/curly/no-implicit-coercion等。允许错误发生处的
`console.error`/`console.warn`，不允许泛化no-console整文件关闭，与用户通知和脱敏要求一致。

## S01.5 验证与失败处理

验收ID：**A01** Deno版本/精确manifest/frozen lock；**A02**
peer图、构建与类型；**A03**全部lint配置加载、规则承接；**A04**
Worker/Storybook/样式生产运行。

本次已完成：读取双方manifest/lock和已安装包peer、检查Deno2.9.6；这不是新组合安装证明。P001必须在临时隔离目录先验证精确清单安装、Vite8+React19.1+Storybook10.6+Vitest4.1.11启动；验证通过才更新Web配置与锁。不得覆盖用户node_modules来把探索伪装成兼容性验证。安装需要的生命周期脚本按照生成锁中的实际版本逐项登记，保留node-liblzma必要安装能力，不使用全局允许所有脚本。

如依赖兼容失败，P001记录具体包/peer或运行错误并阻断后继计划；不擅自升级固定Native基线。P012再在干净checkout运行全部任务，证明目标组合和最终源码一起通过。

## S01.6 迁移分支与中间状态

整个实施在单一隔离迁移分支进行，中间工作包不承诺可部署。P001必须验证工具本身加载、生产构建链和Vitest可启动，并保存新严格规则对全量存量源码的诊断；源码违规按file-map分配到负责工作包，P010统一清零。允许记录中间失败，不允许排除存量源码、临时降低规则或标绿掩盖失败。P011接最终统一门禁，P012只有全部要求通过后才能宣告完成。构建因类型错误提前失败时，隔离工具链冒烟与最终应用构建分别记录，不把前者写为后者成功。

## S01.7 已验证的发布声明兼容处理

P001隔离安装暴露Storybook10.6.0发布声明的两条同行`@ts-expect-error`失效，
详细原版复现、独立复核和hash见[P001验证记录](../review/P001-toolchain-validation.md)。
采用D19：仅将这两条上游已有指令移至对应声明上一行，不新增抑制或修改泛型/运行代码。
这属于依赖发布排版修复，不应被描述为CSF factory泛型正确性修复。

安装准备步骤显式应用该限定修复；固定包版本、相对文件、原文hash和结果hash，
幂等运行，任何其他内容或版本必须失败并要求重新审查。typecheck/check只验证准备结果，
不得在检查时写依赖，也不得修改Deno全局cache或相邻项目。清洁安装后必须重放准备步骤。
保留正反类型用例，证明正常Meta/StoryObj可用、错误args仍被拒绝；准备脚本验证首次、重复、
原文不匹配和只读检查行为。未来升级移除此补丁前重新复核，不能自动套用到其他版本。
